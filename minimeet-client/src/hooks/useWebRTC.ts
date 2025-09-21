import { useState, useEffect, useRef, useCallback } from "react";
import { socketService } from "../services/socket";

interface UseWebRTCProps {
  roomId: string;
  localUserId: string;
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

interface IncomingCallInfo {
  fromUserId: string;
  fromUsername: string;
}

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isLocalVideoEnabled: boolean;
  isLocalAudioEnabled: boolean;
  connectedUserId: string | null;
  incomingCall: IncomingCallInfo | null;
}

export const useWebRTC = ({
  roomId,
  localUserId,
  onLog,
  onError,
}: UseWebRTCProps) => {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isCallActive: false,
    isLocalVideoEnabled: true,
    isLocalAudioEnabled: true,
    connectedUserId: null,
    incomingCall: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef<boolean>(false);

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const getSocket = useCallback(() => {
    if (!socketService.socket || !socketService.socket.connected) {
      throw new Error("Socket is not connected");
    }
    return socketService.socket;
  }, []);

  const ensureLocalMedia = useCallback(async (): Promise<MediaStream> => {
    if (state.localStream) return state.localStream;
    try {
      onLog("Requesting camera and microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setState((prev) => ({ ...prev, localStream: stream }));
      onLog("Camera and microphone granted");
      return stream;
    } catch (e: any) {
      onError(`Failed to get user media: ${e?.message || e}`);
      throw e;
    }
  }, [state.localStream, onLog, onError]);

  const createPeer = useCallback((): RTCPeerConnection => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate && state.connectedUserId) {
        try {
          getSocket().emit("webrtc-ice-candidate", {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            fromUserId: localUserId,
            toUserId: state.connectedUserId,
            roomId,
          });
          onLog("Sent ICE candidate");
        } catch (e: any) {
          onError(`Failed to send ICE candidate: ${e?.message || e}`);
        }
      }
    };

    pc.ontrack = (event) => {
      const rStream = event.streams[0];
      setState((prev) => ({ ...prev, remoteStream: rStream }));
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
      onLog("Remote track received");
    };

    pc.onconnectionstatechange = () => {
      onLog(`PC state: ${pc.connectionState}`);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [
    rtcConfig,
    state.connectedUserId,
    getSocket,
    localUserId,
    roomId,
    onLog,
    onError,
  ]);

  const startCall = useCallback(
    async (targetUserId: string) => {
      try {
        onLog(`Starting call with user ${targetUserId}`);
        const stream = await ensureLocalMedia();
        const pc = createPeer();

        if (pc.getSenders().length === 0) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        getSocket().emit("webrtc-offer", {
          type: "offer",
          sdp: offer.sdp,
          fromUserId: localUserId,
          toUserId: targetUserId,
          roomId,
        });

        setState((prev) => ({
          ...prev,
          isCallActive: true,
          connectedUserId: targetUserId,
        }));
        onLog("Offer sent");
      } catch (e: any) {
        onError(`Failed to start call: ${e?.message || e}`);
      }
    },
    [
      ensureLocalMedia,
      createPeer,
      getSocket,
      localUserId,
      roomId,
      onLog,
      onError,
    ],
  );

  const endCall = useCallback(() => {
    onLog("Ending call");

    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (state.localStream) {
        state.localStream.getTracks().forEach((t) => t.stop());
      }

      if (state.connectedUserId) {
        try {
          getSocket().emit("webrtc-hang-up", {
            toUserId: state.connectedUserId,
            roomId,
          });
        } catch {}
      }
    } finally {
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

      setState({
        localStream: null,
        remoteStream: null,
        isCallActive: false,
        isLocalVideoEnabled: true,
        isLocalAudioEnabled: true,
        connectedUserId: null,
        incomingCall: null,
      });
    }
  }, [getSocket, roomId, state.localStream, state.connectedUserId, onLog]);

  const toggleVideo = useCallback(() => {
    const track = state.localStream?.getVideoTracks()?.[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setState((prev) => ({ ...prev, isLocalVideoEnabled: track.enabled }));
    onLog(track.enabled ? "Video enabled" : "Video disabled");
  }, [state.localStream, onLog]);

  const toggleAudio = useCallback(() => {
    const track = state.localStream?.getAudioTracks()?.[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setState((prev) => ({ ...prev, isLocalAudioEnabled: track.enabled }));
    onLog(track.enabled ? "Audio unmuted" : "Audio muted");
  }, [state.localStream, onLog]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!socketService.socket) return;
    const s = socketService.socket;

    const onOffer = async (data: {
      sdp: string;
      fromUserId: string;
      toUserId: string;
      roomId: string;
    }) => {
      if (data.toUserId !== localUserId) return;
      try {
        onLog("Offer received");
        const stream = await ensureLocalMedia();
        const pc = createPeer();

        if (pc.getSenders().length === 0) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        await pc.setRemoteDescription({ type: "offer", sdp: data.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        getSocket().emit("webrtc-answer", {
          type: "answer",
          sdp: answer.sdp,
          fromUserId: localUserId,
          toUserId: data.fromUserId,
          roomId,
        });

        setState((prev) => ({
          ...prev,
          isCallActive: true,
          connectedUserId: data.fromUserId,
        }));
        onLog("Answer sent");
      } catch (e: any) {
        onError(`Failed to handle offer: ${e?.message || e}`);
      }
    };

    const onAnswer = async (data: {
      sdp: string;
      fromUserId: string;
      toUserId: string;
      roomId: string;
    }) => {
      if (data.toUserId !== localUserId) return;
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        onLog("Answer received");
        await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
        onLog("Remote description set");
      } catch (e: any) {
        onError(`Failed to handle answer: ${e?.message || e}`);
      }
    };

    const onIce = async (data: {
      candidate: string;
      sdpMid: string | null;
      sdpMLineIndex: number | null;
      fromUserId: string;
      toUserId: string;
      roomId: string;
    }) => {
      if (data.toUserId !== localUserId) return;
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        await pc.addIceCandidate({
          candidate: data.candidate,
          sdpMid: data.sdpMid || undefined,
          sdpMLineIndex:
            data.sdpMLineIndex === null ? undefined : data.sdpMLineIndex,
        });
        onLog("ICE candidate added");
      } catch (e: any) {
        onError(`Failed to add ICE candidate: ${e?.message || e}`);
      }
    };

    const onHangup = (data: {
      fromUserId: string;
      toUserId: string;
      roomId: string;
    }) => {
      if (data.toUserId !== localUserId) return;
      onLog("Remote ended the call");
      endCall();
    };

    const onIncomingCall = (data: {
      fromUserId: string;
      fromUsername: string;
      toUserId: string;
      roomId: string;
    }) => {
      if (data.toUserId !== localUserId) return;
      setState((prev) => ({
        ...prev,
        incomingCall: {
          fromUserId: data.fromUserId,
          fromUsername: data.fromUsername,
        },
      }));
      onLog(`Incoming call from ${data.fromUsername}`);
    };

    s.on("webrtc-offer-received", onOffer);
    s.on("webrtc-answer-received", onAnswer);
    s.on("webrtc-ice-candidate-received", onIce);
    s.on("webrtc-call-ended", onHangup);
    s.on("webrtc-incoming-call", onIncomingCall);

    return () => {
      s.off("webrtc-offer-received", onOffer);
      s.off("webrtc-answer-received", onAnswer);
      s.off("webrtc-ice-candidate-received", onIce);
      s.off("webrtc-call-ended", onHangup);
      s.off("webrtc-incoming-call", onIncomingCall);
    };
  }, [
    localUserId,
    roomId,
    ensureLocalMedia,
    createPeer,
    getSocket,
    endCall,
    onLog,
    onError,
  ]);

  useEffect(() => {
    return () => {
      if (mountedRef.current) return;
      endCall();
    };
  }, [endCall]);

  const answerCall = useCallback(
    async (fromUserId: string) => {
      try {
        setState((prev) => ({
          ...prev,
          incomingCall: null,
          connectedUserId: fromUserId,
          isCallActive: true,
        }));
        onLog(`Accepting call from ${fromUserId}`);
      } catch (e: any) {
        onError(`Failed to accept call: ${e?.message || e}`);
      }
    },
    [onLog, onError],
  );

  const rejectCall = useCallback(() => {
    if (!state.incomingCall) return;
    try {
      getSocket().emit("webrtc-answer-call", {
        fromUserId: state.incomingCall.fromUserId,
        toUserId: localUserId,
        roomId,
        accepted: false,
      });
      setState((prev) => ({ ...prev, incomingCall: null }));
      onLog("Call rejected");
    } catch (e: any) {
      onError(`Failed to reject call: ${e?.message || e}`);
    }
  }, [state.incomingCall, getSocket, localUserId, roomId, onLog, onError]);

  return {
    ...state,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  };
};
