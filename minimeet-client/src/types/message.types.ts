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
  participants: Array<{
    id: string;
    username: string;
    email: string;
  }>;
}
