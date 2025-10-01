import { useState, useEffect, useRef, useCallback } from "react";
import { socketService } from "../services/socket";

interface UseWebRTCMeshProps {
  roomId: string;
  localUserId: string;
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

interface ParticipantInfo {
  id: string;
  username: string;
  email: string;
  socketId?: string;
}

interface WebRTCMeshState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isCallActive: boolean;
  isLocalVideoEnabled: boolean;
  isLocalAudioEnabled: boolean;
  connectedUserIds: string[];
}

export const useWebRTCMesh = ({
  roomId,
  localUserId,
  onLog,
  onError,
}: UseWebRTCMeshProps) => {
  const [state, setState] = useState<WebRTCMeshState>({
    localStream: null,
    remoteStreams: new Map(),
    isCallActive: false,
    isLocalVideoEnabled: true,
    isLocalAudioEnabled: true,
    connectedUserIds: [],
  });

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
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

  const getRoomParticipants = useCallback((): Promise<ParticipantInfo[]> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout getting room participants"));
      }, 5000);

      const handler = (data: { roomId: string; participants: ParticipantInfo[] }) => {
        clearTimeout(timeout);
        getSocket().off("room-participants", handler);
        getSocket().off("room-participants-error", errorHandler);
        resolve(data.participants);
      };

      const errorHandler = (data: { error: string }) => {
        clearTimeout(timeout);
        getSocket().off("room-participants", handler);
        getSocket().off("room-participants-error", errorHandler);
        reject(new Error(data.error));
      };

      getSocket().on("room-participants", handler);
      getSocket().on("room-participants-error", errorHandler);
      getSocket().emit("get-room-participants", { roomId });
    });
  }, [roomId, getSocket]);

  const createPeerForUser = useCallback(
    (userId: string, stream: MediaStream): RTCPeerConnection => {
      if (peerConnectionsRef.current.has(userId)) {
        return peerConnectionsRef.current.get(userId)!;
      }

      onLog(`Creating peer connection for ${userId}`);
      const pc = new RTCPeerConnection(rtcConfig);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          try {
            getSocket().emit("webrtc-ice-candidate", {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              fromUserId: localUserId,
              toUserId: userId,
              roomId,
            });
            onLog(`Sent ICE candidate to ${userId}`);
          } catch (e: any) {
            onError(`Failed to send ICE candidate: ${e?.message || e}`);
          }
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        onLog(`Remote track received from ${userId} (kind: ${event.track.kind})`);
        
        // Get or create remote stream for this user
        let remoteStream = remoteStreamsRef.current.get(userId);
        
        if (!remoteStream) {
          // Create new stream if it doesn't exist
          remoteStream = new MediaStream();
          remoteStreamsRef.current.set(userId, remoteStream);
          onLog(`Created new remote stream for ${userId}`);
        }
        
        // Add the track to the stream
        remoteStream.addTrack(event.track);
        onLog(`Added ${event.track.kind} track to stream for ${userId}`);

        // Update state to trigger re-render
        setState((prev) => ({
          ...prev,
          remoteStreams: new Map(remoteStreamsRef.current),
          connectedUserIds: Array.from(remoteStreamsRef.current.keys()),
        }));
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        onLog(`PC state for ${userId}: ${pc.connectionState}`);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          onLog(`Connection to ${userId} ${pc.connectionState}`);
        }
      };

      peerConnectionsRef.current.set(userId, pc);
      return pc;
    },
    [getSocket, localUserId, roomId, onLog, onError, rtcConfig]
  );

  const startMeshCall = useCallback(async () => {
    try {
      onLog("Starting mesh call...");

      // Get local media
      const stream = await ensureLocalMedia();

      // Get all participants
      const participants = await getRoomParticipants();
      onLog(`Found ${participants.length} other participants`);

      if (participants.length === 0) {
        onError("No other participants in the room");
        return;
      }

      // Create peer connection for each participant
      for (const participant of participants) {
        onLog(`Connecting to ${participant.username}`);
        const pc = createPeerForUser(participant.id, stream);

        // Create and send offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        getSocket().emit("webrtc-offer", {
          type: "offer",
          sdp: offer.sdp,
          fromUserId: localUserId,
          toUserId: participant.id,
          roomId,
        });

        onLog(`Offer sent to ${participant.username}`);
      }

      setState((prev) => ({
        ...prev,
        isCallActive: true,
      }));
    } catch (e: any) {
      onError(`Failed to start mesh call: ${e?.message || e}`);
    }
  }, [
    ensureLocalMedia,
    getRoomParticipants,
    createPeerForUser,
    getSocket,
    localUserId,
    roomId,
    onLog,
    onError,
  ]);

  const endMeshCall = useCallback(() => {
    onLog("Ending mesh call");

    try {
      // Close all peer connections
      peerConnectionsRef.current.forEach((pc, userId) => {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.close();

        // Notify peer
        try {
          getSocket().emit("webrtc-hang-up", {
            toUserId: userId,
            roomId,
          });
        } catch {}
      });

      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();

      // Stop local media
      if (state.localStream) {
        state.localStream.getTracks().forEach((t) => t.stop());
      }
    } finally {
      if (localVideoRef.current) localVideoRef.current.srcObject = null;

      setState({
        localStream: null,
        remoteStreams: new Map(),
        isCallActive: false,
        isLocalVideoEnabled: true,
        isLocalAudioEnabled: true,
        connectedUserIds: [],
      });
    }
  }, [getSocket, roomId, state.localStream, onLog]);

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

  // Set up WebRTC event listeners
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
        onLog(`Offer received from ${data.fromUserId}`);
        const stream = await ensureLocalMedia();
        const pc = createPeerForUser(data.fromUserId, stream);

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
        }));
        onLog(`Answer sent to ${data.fromUserId}`);
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

      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (!pc) return;

      try {
        onLog(`Answer received from ${data.fromUserId}`);
        await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
        onLog(`Remote description set for ${data.fromUserId}`);
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

      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (!pc) return;

      try {
        await pc.addIceCandidate({
          candidate: data.candidate,
          sdpMid: data.sdpMid || undefined,
          sdpMLineIndex:
            data.sdpMLineIndex === null ? undefined : data.sdpMLineIndex,
        });
        onLog(`ICE candidate added from ${data.fromUserId}`);
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

      onLog(`${data.fromUserId} ended the call`);

      // Close connection to this user
      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.fromUserId);
      }

      // Remove remote stream
      remoteStreamsRef.current.delete(data.fromUserId);

      // Update state
      setState((prev) => ({
        ...prev,
        remoteStreams: new Map(remoteStreamsRef.current),
        connectedUserIds: Array.from(remoteStreamsRef.current.keys()),
        isCallActive: remoteStreamsRef.current.size > 0 || prev.localStream !== null,
      }));
    };

    s.on("webrtc-offer-received", onOffer);
    s.on("webrtc-answer-received", onAnswer);
    s.on("webrtc-ice-candidate-received", onIce);
    s.on("webrtc-call-ended", onHangup);

    return () => {
      s.off("webrtc-offer-received", onOffer);
      s.off("webrtc-answer-received", onAnswer);
      s.off("webrtc-ice-candidate-received", onIce);
      s.off("webrtc-call-ended", onHangup);
    };
  }, [
    localUserId,
    roomId,
    ensureLocalMedia,
    createPeerForUser,
    getSocket,
    onLog,
    onError,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mountedRef.current) return;
      endMeshCall();
    };
  }, [endMeshCall]);

  return {
    ...state,
    localVideoRef,
    remoteStreamsRef,
    startMeshCall,
    endMeshCall,
    toggleVideo,
    toggleAudio,
  };
};
