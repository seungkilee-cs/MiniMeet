import { useState, useEffect, useRef, useCallback } from "react";
import { socketService } from "../services/socket";

interface UseWebRTCProps {
  roomId: string;
  localUserId: string;
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isLocalVideoEnabled: boolean;
  isLocalAudioEnabled: boolean;
  connectedUserId: string | null;
  incomingCall: {
    fromUserId: string;
    fromUsername: string;
  } | null;
}

export const useWebRTC = ({
  roomId,
  localUserId,
  onLog,
  onError,
}: UseWebRTCProps) => {
  // State management
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isCallActive: false,
    isLocalVideoEnabled: true,
    isLocalAudioEnabled: true,
    connectedUserId: null,
    incomingCall: null,
  });

  // WebRTC peer connection ref
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Placeholder functions - we'll add full implementation later
  const startCall = useCallback(
    async (targetUserId: string) => {
      onLog(`📞 Starting call with user ${targetUserId}`);
      // Full implementation will be added
    },
    [onLog],
  );

  const answerCall = useCallback(
    async (fromUserId: string) => {
      onLog(`📞 Answering call from user ${fromUserId}`);
      // Full implementation will be added
    },
    [onLog],
  );

  const rejectCall = useCallback(() => {
    onLog("📞 Call rejected");
    // Full implementation will be added
  }, [onLog]);

  const endCall = useCallback(() => {
    onLog("📞 Ending call");
    // Full implementation will be added
  }, [onLog]);

  const toggleVideo = useCallback(() => {
    onLog("📹 Video toggle");
    // Full implementation will be added
  }, [onLog]);

  const toggleAudio = useCallback(() => {
    onLog("🎙️ Audio toggle");
    // Full implementation will be added
  }, [onLog]);

  // Basic socket listener setup
  useEffect(() => {
    if (!socketService.socket) return;

    const handleIncomingCall = (data: any) => {
      if (data.toUserId === localUserId) {
        onLog(`📞 Incoming call from ${data.fromUsername}`);
        setState((prev) => ({
          ...prev,
          incomingCall: {
            fromUserId: data.fromUserId,
            fromUsername: data.fromUsername,
          },
        }));
      }
    };

    socketService.socket.on("webrtc-incoming-call", handleIncomingCall);

    return () => {
      socketService.socket?.off("webrtc-incoming-call", handleIncomingCall);
    };
  }, [localUserId, onLog]);

  return {
    // State
    ...state,

    // Refs for video elements
    localVideoRef,
    remoteVideoRef,

    // Actions
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  };
};
