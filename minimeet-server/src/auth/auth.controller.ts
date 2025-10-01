import { Controller, Post, Param, Headers, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token/:userId')
  async generateToken(@Param('userId') userId: string) {
    try {
      const token = await this.authService.generateToken(userId);
      return {
        access_token: token,
        token_type: 'Bearer',
        expires_in: '24h',
      };
    } catch (error) {
      throw new Error(`Failed to generate token: ${(error as Error).message}`);
    }
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    const token = this.extractToken(authHeader);
    if (!token) {
      return { success: false, message: 'No token provided' };
    }

    await this.authService.logout(token);
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('logout-all/:userId')
  async logoutAll(@Param('userId') userId: string) {
    const count = await this.authService.logoutAllSessions(userId);
    return {
      success: true,
      message: `Logged out from ${count} sessions`,
      sessionsDestroyed: count,
    };
  }

  @Get('sessions/:userId')
  async getSessions(@Param('userId') userId: string) {
    const sessions = await this.authService.getUserSessions(userId);
    const count = await this.authService.getUserSessionCount(userId);
    return {
      userId,
      sessionCount: count,
      sessions: sessions.map((s) => ({
        username: s.username,
        createdAt: new Date(s.createdAt).toISOString(),
        lastActivity: new Date(s.lastActivity).toISOString(),
      })),
    };
  }

  private extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
