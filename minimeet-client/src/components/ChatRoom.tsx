import React, { useState, useEffect } from "react";
import { socketService } from "../services/socket";
import { Message, CreateMessageDto } from "../types/message.types";

const ChatRoom: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState<string>("");
  const [participants, setParticipants] = useState<
    Array<{ id: string; username: string; email: string }>
  >([]);

  useEffect(() => {
    socketService.onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketService.onParticipantsUpdate((data) => {
      if (data.roomId === roomId) {
        setParticipants(data.participants);
      }
    });

    socketService.onMessageHistory((data) => {
      if (data.roomId === roomId) {
        setMessages(data.messages);
      }
    });

    socketService.loadMessageHistory({ roomId, limit: 50 });

    return () => {
      socketService.leaveRoom(roomId);
    };
  }, [roomId]);

  const handleSend = () => {
    const dto: CreateMessageDto = { content, roomId };
    socketService.sendMessage(dto);
    setContent("");
  };

  return (
    <div>
      <h2>Room: {roomId}</h2>

      <div>
        <h3>Participants ({participants.length}):</h3>
        <ul>
          {participants.map((p) => (
            <li key={p.id}>
              {p.username} ({p.email})
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((msg) => (
            <li key={msg.id}>
              <strong>{msg.sender.username}:</strong> {msg.content}{" "}
              <em>{new Date(msg.timestamp).toLocaleTimeString()}</em>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
