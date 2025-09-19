import React, { useState } from "react";
import { apiClient } from "./services/api";
import { socketService } from "./services/socket";
import ChatRoom from "./components/ChatRoom";

const App: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const handleGetToken = async () => {
    try {
      const newToken = await apiClient.getToken(userId);
      setToken(newToken);
      socketService.connect(newToken);
    } catch (error) {
      console.error("Failed to get token", error);
    }
  };

  return (
    <div className="App">
      <h1>MiniMeet Client</h1>

      <div>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
        />
        <button onClick={handleGetToken}>Get Token</button>
      </div>

      <div>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
        />
        <button onClick={() => socketService.joinRoom(roomId)}>
          Join Room
        </button>
      </div>

      {roomId && <ChatRoom roomId={roomId} />}
    </div>
  );
};

export default App;
