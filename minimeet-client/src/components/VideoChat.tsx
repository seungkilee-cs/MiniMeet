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
  const { localVideoRef, remoteVideoRef, startCall, isCallActive } = useWebRTC({
    roomId,
    localUserId: currentUserId,
    onLog,
    onError,
  });

  // Get other participants (exclude current user)
  const otherParticipants = participants.filter((p) => p.id !== currentUserId);

  return (
    <div className="video-chat">
      <h2> Video Chat</h2>

      {/* Video Area */}
      <div className="video-area">
        {/* Local Video */}
        <div className="video-container">
          <h4>You</h4>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "300px", height: "200px", backgroundColor: "#000" }}
          />
        </div>

        {/* Remote Video */}
        {isCallActive && (
          <div className="video-container">
            <h4>Remote User</h4>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: "300px",
                height: "200px",
                backgroundColor: "#000",
              }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="video-controls">
        <h4>Available Participants:</h4>
        {otherParticipants.length > 0 ? (
          otherParticipants.map((participant) => (
            <div key={participant.id} style={{ margin: "10px 0" }}>
              <span>{participant.username}</span>
              <button
                onClick={() => startCall(participant.id)}
                style={{ marginLeft: "10px", padding: "5px 15px" }}
              >
                Call
              </button>
            </div>
          ))
        ) : (
          <p>No other participants to call</p>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
