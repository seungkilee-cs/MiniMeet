import React, { useState, useEffect } from "react";
import { socketService } from "../services/socket";
import { Message, User, CreateMessageDto } from "../types/message.types";

interface ChatRoomProps {
  roomId: string;
  onLog: (message: string) => void; // ← Add this prop
  onError: (error: string) => void; // ← Add this prop
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onLog, onError }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");

  useEffect(() => {
    // Set up socket event listeners
    socketService.onNewMessage((message) => {
      onLog(`💬 New message from ${message.sender.username}`);
      setMessages((prev) => [...prev, message]);
    });

    socketService.onParticipantsUpdate((data) => {
      onLog(`👥 Participants update: ${data.participants.length} users`);
      setParticipants(data.participants);
    });

    socketService.onMessageHistory((data) => {
      onLog(`📜 Loaded ${data.messages.length} previous messages`);
      setMessages(data.messages);
    });

    // Load message history when room changes
    socketService.loadMessageHistory({ roomId, limit: 50 });

    // Cleanup on unmount
    return () => {
      setMessages([]);
      setParticipants([]);
    };
  }, [roomId, onLog]);

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content) {
      onError("Message cannot be empty");
      return;
    }

    if (content.length > 500) {
      onError("Message too long (max 500 characters)");
      return;
    }

    const dto: CreateMessageDto = { content, roomId };
    onLog(
      `📤 Sending message: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}", roomId=${roomId}`,
    );
    socketService.sendMessage(dto);
    setMessageInput("");
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Participants Section */}
      <div className="participants">
        <h3>Room Participants:</h3>
        <div>
          {participants.length === 0 ? (
            <em>No participants</em>
          ) : (
            participants.map((p) => (
              <div
                key={p.id}
                style={{ padding: "5px", borderBottom: "1px solid #ddd" }}
              >
                👤 <strong>{p.username}</strong>
                <br />
                <small>{p.email}</small>
                <br />
                <small style={{ color: "#666" }}>
                  ID: {p.id.substring(0, 8)}...
                </small>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        <h3>Chat Messages:</h3>
        <div
          className="messages"
          style={{
            height: "400px",
            overflowY: "scroll",
            border: "1px solid #ddd",
            padding: "10px",
            background: "white",
            marginBottom: "10px",
          }}
        >
          {messages.length === 0 ? (
            <em>No messages</em>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="message"
                style={{
                  marginBottom: "10px",
                  padding: "8px",
                  borderRadius: "5px",
                  background: "#f1f1f1",
                }}
              >
                <div style={{ fontWeight: "bold", color: "#007bff" }}>
                  {message.sender.username}
                </div>
                <div>{message.content}</div>
                <div style={{ fontSize: "0.8em", color: "#666" }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (1-500 characters)"
            rows={2}
            maxLength={500}
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "3px",
              resize: "none",
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || messageInput.length > 500}
          >
            Send
          </button>
        </div>

        {/* Character Counter */}
        <div
          style={{
            fontSize: "0.8em",
            marginTop: "5px",
            textAlign: "right",
            color: "#6c757d",
          }}
        >
          {messageInput.length}/500
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
