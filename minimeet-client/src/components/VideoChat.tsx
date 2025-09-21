import React from "react";
import { useWebRTC } from "../hooks/useWebRTC";

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
    <div className="video-surface">
      <h3 style={{ margin: 0, fontSize: 14, color: "#9aa3b2" }}>Video Chat</h3>

      <div className="video-grid">
        <div className="video-tile">
          <h4>You</h4>
          <video ref={localVideoRef} autoPlay muted playsInline />
        </div>
        <div className="video-tile">
          <h4>Remote</h4>
          <video ref={remoteVideoRef} autoPlay playsInline />
        </div>
      </div>

      <div className="controls-row">
        {others.map((p) => (
          <button key={p.id} onClick={() => startCall(p.id)}>
            Call {p.username}
          </button>
        ))}
        {isCallActive && (
          <button className="btn-danger" onClick={endCall}>
            End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
