import { io, Socket } from "socket.io-client";
import {
  CreateMessageDto,
  Message,
  LoadMessageHistoryDto,
} from "../types/message.types";

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    this.socket = io(
      process.env.REACT_APP_SOCKET_URL || "http://localhost:3001",
      {
        auth: { token },
      },
    );

    this.socket.on("connect", () => {
      console.log("Socket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return this.socket;
  }

  joinRoom(roomId: string) {
    this.socket?.emit("joinRoom", { roomId });
  }

  leaveRoom(roomId: string) {
    this.socket?.emit("leaveRoom", { roomId });
  }

  sendMessage(dto: CreateMessageDto) {
    this.socket?.emit("sendMessage", dto);
  }

  loadMessageHistory(dto: LoadMessageHistoryDto) {
    this.socket?.emit("loadMessageHistory", dto);
  }

  onJoinSuccess(callback: (data: { roomId: string; message: string }) => void) {
    this.socket?.on("joinRoomSuccess", callback);
  }

  onParticipantsUpdate(
    callback: (data: {
      roomId: string;
      participants: Array<{ id: string; username: string; email: string }>;
    }) => void,
  ) {
    this.socket?.on("participantsUpdate", callback);
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on("newMessage", callback);
  }

  onMessageHistory(
    callback: (data: { roomId: string; messages: Message[] }) => void,
  ) {
    this.socket?.on("messageHistory", callback);
  }

  onMessageError(callback: (data: { error: string }) => void) {
    this.socket?.on("messageError", callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();
