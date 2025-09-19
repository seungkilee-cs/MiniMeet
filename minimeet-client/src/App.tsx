// src/App.tsx
import React, { useState } from "react";
import { apiClient } from "./services/api";
import { socketService } from "./services/socket";
import ChatRoom from "./components/ChatRoom";
import AuthSection from "./components/AuthSection";
import ConnectionSection from "./components/ConnectionSection";
import StatusDisplay from "./components/StatusDisplay";
import ConsoleLog from "./components/ConsoleLog";
import "./App.css";

const App: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [currentRoomId, setCurrentRoomId] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("Not connected");
  const [error, setError] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logMessage]);
    console.log(logMessage);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 8000);
  };

  const handleGetToken = async () => {
    if (!userId.trim()) {
      showError("Please enter a User ID");
      return;
    }

    try {
      const newToken = await apiClient.getToken(userId.trim());
      setToken(newToken);
      addLog(`✅ Token obtained for user ${userId}`);
    } catch (error: any) {
      addLog(`❌ Token error: ${error.message}`);
      showError(error.message);
    }
  };

  const handleConnect = () => {
    if (!token) {
      showError("Please get a token first");
      return;
    }

    const socket = socketService.connect(token);

    socket.on("connect", () => {
      addLog(`✅ Connected! Socket ID: ${socket.id}`);
      setStatus("Connected and authenticated");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      addLog("❌ Disconnected from server");
      setStatus("Disconnected");
      setIsConnected(false);
      setCurrentRoomId("");
    });

    socket.on("authError", (data: any) => {
      addLog(`🔒 Auth error: ${data.message}`);
      showError(`Authentication failed: ${data.message}`);
    });

    // Room events
    socketService.onJoinSuccess((data) => {
      addLog(`✅ Successfully joined room: ${data.roomId}`);
      setCurrentRoomId(data.roomId);
    });

    socketService.onMessageError((data) => {
      addLog(`❌ Message error: ${data.error}`);
      let userMessage = data.error;
      if (data.error.includes("too long")) {
        userMessage =
          "Message is too long (max 500 characters). Please shorten it.";
      } else if (
        data.error.includes("empty") ||
        data.error.includes("too short")
      ) {
        userMessage = "Message cannot be empty. Please enter some text.";
      }
      showError(userMessage);
    });
  };

  const handleJoinRoom = () => {
    if (!isConnected) {
      showError("Please connect first");
      return;
    }

    if (!roomId.trim()) {
      showError("Please enter a Room ID");
      return;
    }

    addLog(`📤 Joining room: ${roomId}`);
    socketService.joinRoom(roomId.trim());
  };

  const handleLeaveRoom = () => {
    if (!isConnected) {
      showError("Please connect first");
      return;
    }

    if (!currentRoomId) {
      showError("Not in any room");
      return;
    }

    addLog(`📤 Leaving room: ${currentRoomId}`);
    socketService.leaveRoom(currentRoomId);
  };

  return (
    <div className="container">
      <h1> MiniMeet Chat </h1>

      <AuthSection
        userId={userId}
        onUserIdChange={setUserId}
        onGetToken={handleGetToken}
        token={token}
      />

      <ConnectionSection
        onConnect={handleConnect}
        roomId={roomId}
        onRoomIdChange={setRoomId}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
        isConnected={isConnected}
      />

      <StatusDisplay status={status} error={error} />

      {currentRoomId && (
        <ChatRoom roomId={currentRoomId} onLog={addLog} onError={showError} />
      )}

      <ConsoleLog logs={logs} />
    </div>
  );
};

export default App;
