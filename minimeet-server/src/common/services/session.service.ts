import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../providers/redis-client.provider';

/**
 * Session data stored in Redis for each authenticated user
 */
export interface SessionData {
  userId: string;
  username: string;
  email: string;
  createdAt: number;
  lastActivity: number;
}

/**
 * Service to manage user sessions in Redis
 * Provides centralized session storage for JWT tokens
 * Enables session invalidation and distributed session support
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly TOKEN_SESSION_PREFIX = 'token:';
  private readonly USER_TOKENS_PREFIX = 'user:tokens:';
  private readonly DEFAULT_TTL = 86400; // 24 hours in seconds

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Store JWT token with associated session data
   * @param token - JWT token string
   * @param data - Session data to store
   * @param ttl - Time to live in seconds (default: 24 hours)
   */
  async createSession(
    token: string,
    data: SessionData,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    try {
      const tokenKey = `${this.TOKEN_SESSION_PREFIX}${token}`;
      const userTokensKey = `${this.USER_TOKENS_PREFIX}${data.userId}`;

      // Store session data
      await this.redis.setex(tokenKey, ttl, JSON.stringify(data));

      // Track token for this user (for logout all sessions)
      await this.redis.sadd(userTokensKey, token);
      await this.redis.expire(userTokensKey, ttl);

      this.logger.log(
        `Session created for user ${data.username} (${data.userId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create session: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Retrieve session data by token
   * @param token - JWT token string
   * @returns Session data or null if not found/expired
   */
  async getSession(token: string): Promise<SessionData | null> {
    try {
      const key = `${this.TOKEN_SESSION_PREFIX}${token}`;
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as SessionData;
    } catch (error) {
      this.logger.error(
        `Failed to get session: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Update session last activity timestamp and extend TTL
   * @param token - JWT token string
   * @param ttl - New TTL in seconds (default: 24 hours)
   */
  async touchSession(
    token: string,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    try {
      const session = await this.getSession(token);
      if (!session) {
        return;
      }

      session.lastActivity = Date.now();
      const key = `${this.TOKEN_SESSION_PREFIX}${token}`;

      // Update session data and extend TTL
      await this.redis.setex(key, ttl, JSON.stringify(session));
    } catch (error) {
      this.logger.error(
        `Failed to touch session: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Check if a session exists and is valid
   * @param token - JWT token string
   * @returns true if session exists
   */
  async sessionExists(token: string): Promise<boolean> {
    try {
      const key = `${this.TOKEN_SESSION_PREFIX}${token}`;
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check session existence: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Invalidate a single session (logout)
   * @param token - JWT token string
   */
  async destroySession(token: string): Promise<void> {
    try {
      const session = await this.getSession(token);
      if (!session) {
        return;
      }

      const tokenKey = `${this.TOKEN_SESSION_PREFIX}${token}`;
      const userTokensKey = `${this.USER_TOKENS_PREFIX}${session.userId}`;

      // Remove session
      await this.redis.del(tokenKey);

      // Remove token from user's token set
      await this.redis.srem(userTokensKey, token);

      this.logger.log(
        `Session destroyed for user ${session.username} (${session.userId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to destroy session: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Invalidate all sessions for a user (logout from all devices)
   * @param userId - User identifier
   */
  async destroyUserSessions(userId: string): Promise<number> {
    try {
      const userTokensKey = `${this.USER_TOKENS_PREFIX}${userId}`;

      // Get all tokens for this user
      const tokens = await this.redis.smembers(userTokensKey);

      if (tokens.length === 0) {
        return 0;
      }

      // Delete all session keys
      const pipeline = this.redis.pipeline();
      tokens.forEach((token) => {
        const tokenKey = `${this.TOKEN_SESSION_PREFIX}${token}`;
        pipeline.del(tokenKey);
      });

      // Delete user tokens set
      pipeline.del(userTokensKey);

      await pipeline.exec();

      this.logger.log(
        `Destroyed ${tokens.length} sessions for user ${userId}`,
      );

      return tokens.length;
    } catch (error) {
      this.logger.error(
        `Failed to destroy user sessions: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get all active sessions for a user
   * @param userId - User identifier
   * @returns Array of session data
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userTokensKey = `${this.USER_TOKENS_PREFIX}${userId}`;
      const tokens = await this.redis.smembers(userTokensKey);

      if (tokens.length === 0) {
        return [];
      }

      const sessions: SessionData[] = [];

      for (const token of tokens) {
        const session = await this.getSession(token);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      this.logger.error(
        `Failed to get user sessions: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Get count of active sessions for a user
   * @param userId - User identifier
   * @returns Number of active sessions
   */
  async getUserSessionCount(userId: string): Promise<number> {
    try {
      const userTokensKey = `${this.USER_TOKENS_PREFIX}${userId}`;
      return await this.redis.scard(userTokensKey);
    } catch (error) {
      this.logger.error(
        `Failed to get user session count: ${(error as Error).message}`,
      );
      return 0;
    }
  }

  /**
   * Clean up expired sessions (maintenance task)
   * Redis handles TTL automatically, but this can be used for manual cleanup
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      let cleaned = 0;
      const pattern = `${this.TOKEN_SESSION_PREFIX}*`;
      const keys = await this.redis.keys(pattern);

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -2) {
          // Key doesn't exist
          cleaned++;
        }
      }

      this.logger.log(`Cleaned up ${cleaned} expired sessions`);
      return cleaned;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired sessions: ${(error as Error).message}`,
      );
      return 0;
    }
  }
}
