export interface CreateMessageDto {
  content: string;
  roomId: string;
}

export interface LoadMessageHistoryDto {
  roomId: string;
  limit?: number;
}

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    email: string;
  };
  roomId: string;
  timestamp: string;
}

export interface Room {
  id: string;
  name: string;
  participants: User[];
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface JoinRoomSuccessData {
  roomId: string;
  message: string;
}

export interface ParticipantsUpdateData {
  roomId: string;
  participants: User[];
}

export interface MessageHistoryData {
  roomId: string;
  messages: Message[];
}

export interface MessageErrorData {
  error: string;
}
