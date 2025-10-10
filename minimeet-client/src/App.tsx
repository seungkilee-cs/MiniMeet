import React, { useState, useCallback } from "react";
import { apiClient } from "./services/api";
import { socketService } from "./services/socket";
import ChatRoom from "./components/ChatRoom";
import VideoChatMesh from "./components/VideoChatMesh";
import AuthSection from "./components/AuthSection";
import ConnectionSection from "./components/ConnectionSection";
import StatusDisplay from "./components/StatusDisplay";
import ThemeToggle from "./components/ThemeToggle";
import "./App.css";

const App: React.FC = () => {
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Not connected");
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState<
    Array<{ id: string; username: string; email: string }>
  >([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
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
      addLog(`Token obtained for user ${userId}`);
    } catch (error: any) {
      addLog(`Token error: ${error.message}`);
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
      addLog(`Connected! Socket ID: ${socket.id}`);
      setStatus("Connected and authenticated");
      setIsConnected(true);
      setCurrentUser({ id: userId, username: userId });
    });

    socket.on("disconnect", () => {
      addLog("Disconnected from server");
      setStatus("Disconnected");
      setIsConnected(false);
      setCurrentRoomId("");
    });

    socket.on("authError", (data: any) => {
      addLog(`Auth error: ${data.message}`);
      showError(`Authentication failed: ${data.message}`);
    });

    socketService.onJoinSuccess((data: { roomId: string }) => {
      addLog(`Successfully joined room: ${data.roomId}`);
      setCurrentRoomId(data.roomId);
    });

    socketService.onLeaveSuccess((data: { roomId: string }) => {
      addLog(`Successfully left room: ${data.roomId}`);
      setCurrentRoomId("");
    });

    socketService.onJoinError((data: { error: string }) => {
      addLog(`Failed to join room: ${data.error}`);
      showError(`Failed to join room: ${data.error}`);
    });

    socketService.onLeaveError((data: { error: string }) => {
      addLog(`Failed to leave room: ${data.error}`);
      showError(`Failed to leave room: ${data.error}`);
    });

    socketService.onMessageError((data: { error: string }) => {
      addLog(`Message error: ${data.error}`);
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

    socketService.onParticipantsUpdate((data: { participants: Array<{ id: string; username: string; email: string }> }) => {
      setParticipants(data.participants);
      addLog(`Participants update: ${data.participants.length} users`);
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

    addLog(`Joining room: ${roomId}`);
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

    addLog(`Leaving room: ${currentRoomId}`);
    socketService.leaveRoom(currentRoomId);
  };

  return (
    <div className="app">
      <div className="tui-scanline"></div>
      <header className="app-header">
        <h1>MiniMeet</h1>
        <div className="app-header-actions">
          <StatusDisplay status={status} error={error} />
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        <aside className="app-sidebar">
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
        </aside>

        <div className={`app-content ${!currentRoomId || participants.length === 0 ? 'no-video' : ''}`}>
          {currentRoomId && currentUser ? (
            <>
              <div className="chat-section-wrapper">
                <ChatRoom
                  roomId={currentRoomId}
                  currentUserId={currentUser.id}
                  onLog={addLog}
                  onError={showError}
                />
              </div>

              {participants.length > 0 && (
                <div className="video-section-wrapper">
                  <VideoChatMesh
                    roomId={currentRoomId}
                    currentUserId={currentUser.id}
                    participants={participants}
                    onLog={addLog}
                    onError={showError}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="no-room-message">
              <h3>Welcome to MiniMeet</h3>
              <p>Get started by following these simple steps to join a room and start chatting with others.</p>
              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <span>Enter your User ID and get an authentication token</span>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <span>Connect to the server using your token</span>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <span>Enter a Room ID and join to start chatting</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* <ConsoleLog logs={logs} /> */}
      </main>
    </div>
  );
};

export default App;
