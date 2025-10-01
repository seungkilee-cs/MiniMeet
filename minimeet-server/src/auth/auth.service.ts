import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionService, SessionData } from '../common/services/session.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Generate JWT token and create Redis session
   */
  async generateToken(userId: string): Promise<string> {
    const user = await this.usersService.findOne(userId);
    const payload = {
      sub: userId,
      username: user.username,
      email: user.email,
    };

    const token = await this.jwtService.signAsync(payload);

    // Create session in Redis
    const sessionData: SessionData = {
      userId: user.id,
      username: user.username,
      email: user.email,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    await this.sessionService.createSession(token, sessionData);

    this.logger.log(`Token generated for user ${user.username} (${user.id})`);

    return token;
  }

  /**
   * Validate JWT token and check Redis session
   */
  async validateToken(token: string): Promise<SessionData | null> {
    try {
      // First verify JWT signature
      const payload = await this.jwtService.verifyAsync(token);

      // Then check if session exists in Redis
      const session = await this.sessionService.getSession(token);

      if (!session) {
        this.logger.warn(`Session not found for token (user: ${payload.sub})`);
        return null;
      }

      // Update last activity
      await this.sessionService.touchSession(token);

      return session;
    } catch (error) {
      this.logger.error(`Token validation failed: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Logout - destroy single session
   */
  async logout(token: string): Promise<void> {
    await this.sessionService.destroySession(token);
    this.logger.log('User logged out (single session)');
  }

  /**
   * Logout from all devices - destroy all user sessions
   */
  async logoutAllSessions(userId: string): Promise<number> {
    const count = await this.sessionService.destroyUserSessions(userId);
    this.logger.log(`User ${userId} logged out from ${count} sessions`);
    return count;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    return this.sessionService.getUserSessions(userId);
  }

  /**
   * Get session count for a user
   */
  async getUserSessionCount(userId: string): Promise<number> {
    return this.sessionService.getUserSessionCount(userId);
  }
}
