import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../providers/redis-client.provider';

/**
 * Service to manage userId <-> socketId mappings in Redis
 * Used for targeted WebRTC signaling to prevent privacy leaks
 */
@Injectable()
export class SocketMappingService {
  private readonly logger = new Logger(SocketMappingService.name);
  private readonly USER_SOCKETS_KEY = 'user:sockets';

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  /**
   * Store or update the socket ID for a user
   * @param userId - User identifier
   * @param socketId - Socket.IO socket identifier
   */
  async setUserSocket(userId: string, socketId: string): Promise<void> {
    try {
      await this.redisClient.hset(this.USER_SOCKETS_KEY, userId, socketId);
      this.logger.log(`Mapped user ${userId} to socket ${socketId}`);
    } catch (error) {
      this.logger.error(
        `Failed to set socket mapping for user ${userId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get the socket ID for a user
   * @param userId - User identifier
   * @returns Socket ID or null if user not connected
   */
  async getUserSocket(userId: string): Promise<string | null> {
    try {
      const socketId = await this.redisClient.hget(
        this.USER_SOCKETS_KEY,
        userId,
      );
      return socketId;
    } catch (error) {
      this.logger.error(
        `Failed to get socket mapping for user ${userId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Remove the socket mapping for a user
   * @param userId - User identifier
   */
  async removeUserSocket(userId: string): Promise<void> {
    try {
      await this.redisClient.hdel(this.USER_SOCKETS_KEY, userId);
      this.logger.log(`Removed socket mapping for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove socket mapping for user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get all connected users and their socket IDs
   * Useful for debugging and monitoring
   */
  async getAllMappings(): Promise<Record<string, string>> {
    try {
      return await this.redisClient.hgetall(this.USER_SOCKETS_KEY);
    } catch (error) {
      this.logger.error(
        `Failed to get all socket mappings: ${(error as Error).message}`,
      );
      return {};
    }
  }

  /**
   * Check if a user is currently connected
   * @param userId - User identifier
   */
  async isUserConnected(userId: string): Promise<boolean> {
    const socketId = await this.getUserSocket(userId);
    return socketId !== null;
  }

  /**
   * Get socket IDs for multiple users at once
   * @param userIds - Array of user identifiers
   * @returns Map of userId to socketId (null if not connected)
   */
  async getUserSockets(
    userIds: string[],
  ): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();

    try {
      if (userIds.length === 0) {
        return result;
      }

      // Use pipeline for efficient batch operations
      const pipeline = this.redisClient.pipeline();
      userIds.forEach((userId) => {
        pipeline.hget(this.USER_SOCKETS_KEY, userId);
      });

      const results = await pipeline.exec();

      userIds.forEach((userId, index) => {
        const [error, socketId] = results?.[index] || [null, null];
        if (error) {
          this.logger.warn(
            `Error fetching socket for user ${userId}: ${error.message}`,
          );
          result.set(userId, null);
        } else {
          result.set(userId, socketId as string | null);
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to get batch socket mappings: ${(error as Error).message}`,
      );
      // Return empty map on error
      userIds.forEach((userId) => result.set(userId, null));
    }

    return result;
  }
}
