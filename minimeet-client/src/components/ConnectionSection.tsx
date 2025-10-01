import React from "react";
import "../style/ConnectionSection.css";

interface ConnectionSectionProps {
  onConnect: () => void;
  roomId: string;
  onRoomIdChange: (roomId: string) => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  isConnected: boolean;
}

const ConnectionSection: React.FC<ConnectionSectionProps> = ({
  onConnect,
  roomId,
  onRoomIdChange,
  onJoinRoom,
  onLeaveRoom,
  isConnected,
}) => {
  return (
    <div className="connection-section">
      <h3 className="connection-title">2. Connect & Join Room</h3>
      <div className="connection-controls">
        <button onClick={onConnect} className="connect-button" disabled={isConnected}>
          {isConnected ? "Connected" : "Connect to Server"}
        </button>
        <input
          type="text"
          value={roomId}
          onChange={(e) => onRoomIdChange(e.target.value)}
          placeholder="Enter Room ID"
          className="connection-input"
        />
        <button onClick={onJoinRoom} className="join-button" disabled={!isConnected}>
          Join Room
        </button>
        <button onClick={onLeaveRoom} className="leave-button" disabled={!isConnected}>
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default ConnectionSection;
