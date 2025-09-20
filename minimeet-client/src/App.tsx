import React, { useState, useCallback } from "react";
import { apiClient } from "./services/api";
import { socketService } from "./services/socket";
import ChatRoom from "./components/ChatRoom";
import VideoChat from "./components/VideoChat";
import AuthSection from "./components/AuthSection";
import ConnectionSection from "./components/ConnectionSection";
import StatusDisplay from "./components/StatusDisplay";
import ConsoleLog from "./components/ConsoleLog";
import "./App.css";

const App: React.FC = () => {
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Not connected");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [participants, setParticipants] = useState<
    Array<{ id: string; username: string; email: string }>
  >([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  // Use useCallback for stable references
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logMessage]);
    console.log(logMessage);
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(""), 8000);
  }, []);

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
      // Store current user info (get from JWT or socket)
      // FIX: fix later -> this is a placeholder - adapt based on the authentication if I ever finish the auth
      setCurrentUser({ id: userId, username: userId });
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

    // Handle join room success
    socketService.onJoinSuccess((data) => {
      addLog(`✅ Successfully joined room: ${data.roomId}`);
      setCurrentRoomId(data.roomId);
    });

    // Handle leave room success - CLEAR THE ROOM
    socketService.onLeaveSuccess((data) => {
      addLog(`✅ Successfully left room: ${data.roomId}`);
      setCurrentRoomId(""); // ← This clears the ChatRoom component
    });

    // Handle join room errors
    socketService.onJoinError((data) => {
      addLog(`❌ Failed to join room: ${data.error}`);
      showError(`Failed to join room: ${data.error}`);
    });

    // Handle leave room errors
    socketService.onLeaveError((data) => {
      addLog(`❌ Failed to leave room: ${data.error}`);
      showError(`Failed to leave room: ${data.error}`);
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

    socketService.onParticipantsUpdate((data) => {
      setParticipants(data.participants);
      addLog(`👥 Participants update: ${data.participants.length} users`);
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
    <div className="app">
      <header className="app-header">
        <h1> MiniMeet Chat - React + TypeScript</h1>
      </header>

      <main className="app-main">
        <AuthSection
          userId={userId}
          token={token}
          onUserIdChange={setUserId}
          onGetToken={handleGetToken}
        />

        <ConnectionSection
          isConnected={isConnected}
          roomId={roomId}
          onRoomIdChange={setRoomId}
          onConnect={handleConnect}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
        />

        <StatusDisplay status={status} error={error} />

        {currentRoomId && currentUser && (
          <>
            <ChatRoom
              roomId={currentRoomId}
              currentUserId={currentUser.id}
              onLog={addLog}
              onError={showError}
            />
            <VideoChat
              roomId={currentRoomId}
              currentUserId={currentUser.id}
              participants={participants}
              onLog={addLog}
              onError={showError}
            />
          </>
        )}

        <ConsoleLog logs={logs} />
      </main>
    </div>
  );
};

export default App;
