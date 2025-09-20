import React, { useState, useEffect } from "react";
import { socketService } from "../services/socket";
import { Message, User, CreateMessageDto } from "../types/message.types";
import "../style/ChatRoom.css";

interface ChatRoomProps {
  roomId: string;
  currentUserId: string;
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  currentUserId,
  onLog,
  onError,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [messageInput, setMessageInput] = useState("");

  // Separate effect for setting up event listeners (run once)
  useEffect(() => {
    // Set up socket event listeners ONCE
    const handleNewMessage = (message: Message) => {
      onLog(` New message from ${message.sender.username}`);
      setMessages((prev) => [...prev, message]);
    };

    const handleParticipantsUpdate = (data: {
      roomId: string;
      participants: User[];
    }) => {
      onLog(` Participants update: ${data.participants.length} users`);
      setParticipants(data.participants);
    };

    const handleMessageHistory = (data: {
      roomId: string;
      messages: Message[];
    }) => {
      onLog(` Loaded ${data.messages.length} previous messages`);
      setMessages(data.messages);
    };

    // Register listeners
    socketService.onNewMessage(handleNewMessage);
    socketService.onParticipantsUpdate(handleParticipantsUpdate);
    socketService.onMessageHistory(handleMessageHistory);

    // Cleanup function to remove listeners
    return () => {
      // Remove event listeners to prevent duplicates
      if (socketService.socket) {
        socketService.socket.off("newMessage", handleNewMessage);
        socketService.socket.off(
          "participantsUpdate",
          handleParticipantsUpdate,
        );
        socketService.socket.off("messageHistory", handleMessageHistory);
      }
    };
  }, []); // Empty dependency array - run only once

  // Separate effect for loading data when room changes
  useEffect(() => {
    if (roomId) {
      // Clear previous room data
      setMessages([]);
      setParticipants([]);

      // Load message history for new room
      socketService.loadMessageHistory({ roomId, limit: 50 });
    }
  }, [roomId]); // Only depends on roomId

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
      ` Sending message: "${content.substring(0, 50)}${
        content.length > 50 ? "..." : ""
      }", roomId=${roomId}`,
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
    <div className="chat-room">
      <h2>Chat Room: {roomId}</h2>

      {/* Participants Section */}
      <div className="participants-section">
        <h3>Room Participants:</h3>
        {participants.length === 0 ? (
          <p>No participants</p>
        ) : (
          <div className="participants-list">
            {participants.map((participant) => (
              <div key={participant.id} className="participant-card">
                <strong>{participant.username}</strong>
                <div>{participant.email}</div>
                <small>ID: {participant.id.substring(0, 8)}...</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="chat-section">
        <h3>Chat Messages:</h3>
        <div className="messages-container">
          {messages.length === 0 ? (
            <p>No messages</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="message">
                <div className="message-header">
                  <strong>{message.sender.username}</strong>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="message-input-section">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (1-500 characters)"
            rows={2}
            maxLength={500}
            className="message-textarea"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || messageInput.length > 500}
            className="send-button"
          >
            Send
          </button>

          {/* Character Counter */}
          <div className="character-counter">{messageInput.length}/500</div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
