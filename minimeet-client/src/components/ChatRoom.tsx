import React, { useState, useEffect } from "react";
import { socketService } from "../services/socket";
import { Message, User, CreateMessageDto } from "../types/message.types";
import "../style/ChatRoom.css";

interface ChatRoomProps {
  roomId: string;
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onLog, onError }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");

  // Separate effect for setting up event listeners (run once)
  useEffect(() => {
    // Set up socket event listeners ONCE
    const handleNewMessage = (message: Message) => {
      onLog(`💬 New message from ${message.sender.username}`);
      setMessages((prev) => [...prev, message]);
    };

    const handleParticipantsUpdate = (data: {
      roomId: string;
      participants: User[];
    }) => {
      onLog(`👥 Participants update: ${data.participants.length} users`);
      setParticipants(data.participants);
    };

    const handleMessageHistory = (data: {
      roomId: string;
      messages: Message[];
    }) => {
      onLog(`📜 Loaded ${data.messages.length} previous messages`);
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
      <div className="participants-section">
        <h3 className="section-title">Room Participants:</h3>
        <div className="participants-list">
          {participants.length === 0 ? (
            <em className="empty-state">No participants</em>
          ) : (
            participants.map((participant) => (
              <div key={participant.id} className="participant-item">
                <div className="participant-avatar">👤</div>
                <div className="participant-info">
                  <strong className="participant-name">
                    {participant.username}
                  </strong>
                  <small className="participant-email">
                    {participant.email}
                  </small>
                  <small className="participant-id">
                    ID: {participant.id.substring(0, 8)}...
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        <h3 className="section-title">Chat Messages:</h3>

        <div className="messages-container">
          {messages.length === 0 ? (
            <em className="empty-state">No messages</em>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="message-item">
                <div className="message-sender">{message.sender.username}</div>
                <div className="message-content">{message.content}</div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="message-input-container">
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
        </div>

        {/* Character Counter */}
        <div className="character-counter">{messageInput.length}/500</div>
      </div>
    </div>
  );
};

export default ChatRoom;
