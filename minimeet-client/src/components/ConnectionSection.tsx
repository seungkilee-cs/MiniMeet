import React from "react";

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
    <div className="controls">
      <h3>2. Connect & Join Room</h3>
      <button onClick={onConnect} disabled={isConnected}>
        {isConnected ? "Connected" : "Connect to Server"}
      </button>
      <input
        type="text"
        value={roomId}
        onChange={(e) => onRoomIdChange(e.target.value)}
        placeholder="Enter Room ID"
        style={{ width: "300px" }}
      />
      <button onClick={onJoinRoom} disabled={!isConnected}>
        Join Room
      </button>
      <button onClick={onLeaveRoom} disabled={!isConnected}>
        Leave Room
      </button>
    </div>
  );
};

export default ConnectionSection;
