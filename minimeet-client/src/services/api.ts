import axios from "axios";
import { Room } from "../types/message.types";

// Define API response types
interface TokenResponse {
  access_token: string;
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
}

export const apiClient = new ApiClient();
