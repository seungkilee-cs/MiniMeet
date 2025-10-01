import axios from "axios";
import { Room } from "../types/message.types";

// Define API response types
interface TokenResponse {
  access_token: string;
}

interface SearchResult {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  senderEmail: string;
  roomId: string;
  timestamp: string;
  highlights?: {
    content?: string[];
  };
  score: number;
}

interface SearchResponse {
  query: string;
  roomId: string;
  resultCount: number;
  results: SearchResult[];
}

interface AnalyticsMetrics {
  totalEvents: number;
  activeUsers: number;
  eventsByType: Record<string, number>;
  eventsByDay: Record<string, number>;
  topRooms: Array<{ roomId: string; eventCount: number }>;
}

class ApiClient {
  private api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001",
    headers: {
      "Content-Type": "application/json",
    },
  });

  constructor() {
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getToken(userId: string): Promise<string> {
    // Using generic typing - cleaner approach
    const response = await this.api.post<TokenResponse>(
      `/auth/token/${userId}`,
    );
    const token = response.data.access_token;
    localStorage.setItem("authToken", token);
    return token;
  }

  async getRooms(): Promise<Room[]> {
    // Using generic typing - response.data is automatically typed as Room[]
    const response = await this.api.get<Room[]>("/rooms");
    return response.data;
  }

  // Search API methods
  async searchMessages(
    query: string,
    roomId?: string,
    limit: number = 50
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    if (roomId) {
      params.append("roomId", roomId);
    }

    const response = await this.api.get<SearchResponse>(
      `/search/messages?${params}`
    );
    return response.data;
  }

  async searchUsers(query: string, limit: number = 20): Promise<any> {
    const response = await this.api.get(
      `/search/users?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
  }

  async searchRooms(query: string, limit: number = 20): Promise<any> {
    const response = await this.api.get(
      `/search/rooms?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
  }

  // Analytics API methods
  async getUserActivity(userId: string, days: number = 30): Promise<any> {
    const response = await this.api.get(
      `/analytics/user/${userId}?days=${days}`
    );
    return response.data;
  }

  async getRoomAnalytics(roomId: string, days: number = 30): Promise<any> {
    const response = await this.api.get(
      `/analytics/room/${roomId}?days=${days}`
    );
    return response.data;
  }

  async getDashboardMetrics(days: number = 7): Promise<AnalyticsMetrics> {
    const response = await this.api.get<AnalyticsMetrics>(
      `/analytics/dashboard?days=${days}`
    );
    return response.data;
  }

  async recordCallMetrics(metrics: any): Promise<void> {
    await this.api.post("/analytics/call-metrics", metrics);
  }

  // User CRUD operations
  async getUsers(): Promise<any[]> {
    const response = await this.api.get<any[]>("/users");
    return response.data;
  }

  async createUser(userData: {
    username: string;
    email: string;
    isActive: boolean;
  }): Promise<any> {
    const response = await this.api.post("/users", userData);
    return response.data;
  }

  async updateUser(
    userId: string,
    userData: { username: string; email: string; isActive: boolean }
  ): Promise<any> {
    const response = await this.api.patch(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.api.delete(`/users/${userId}`);
  }

  // Room CRUD operations
  async createRoom(roomData: {
    name: string;
    maxParticipants: number;
  }): Promise<any> {
    const response = await this.api.post("/rooms", roomData);
    return response.data;
  }

  async updateRoom(
    roomId: string,
    roomData: { name: string; maxParticipants: number }
  ): Promise<any> {
    const response = await this.api.patch(`/rooms/${roomId}`, roomData);
    return response.data;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.api.delete(`/rooms/${roomId}`);
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.api.delete(`/rooms/${roomId}/participants/${userId}`);
  }
}

export const apiClient = new ApiClient();
