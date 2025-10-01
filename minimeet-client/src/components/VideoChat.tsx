import React from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import "../style/VideoChat.css";

interface VideoChatProps {
  roomId: string;
  currentUserId: string;
  participants: Array<{ id: string; username: string; email: string }>;
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

const VideoChat: React.FC<VideoChatProps> = ({
  roomId,
  currentUserId,
  participants,
  onLog,
  onError,
}) => {
  const { localVideoRef, remoteVideoRef, startCall, endCall, isCallActive } =
    useWebRTC({
      roomId,
      localUserId: currentUserId,
      onLog,
      onError,
    });

  const others = participants.filter((p) => p.id !== currentUserId);

  return (
    <div className="video-chat">
      <h3 className="video-chat-title">Video Chat</h3>

      <div className="video-grid">
        <div className="video-tile">
          <h4 className="video-label">You</h4>
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className="video-element"
          />
        </div>
        <div className="video-tile">
          <h4 className="video-label">Remote</h4>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="video-element"
          />
        </div>
      </div>

      <div className="video-controls">
        {others.map((p) => (
          <button 
            key={p.id} 
            onClick={() => startCall(p.id)}
            className="call-button"
          >
            Call {p.username}
          </button>
        ))}
        {isCallActive && (
          <button 
            className="end-call-button"
            onClick={endCall}
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
