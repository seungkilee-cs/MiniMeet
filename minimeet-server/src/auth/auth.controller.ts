import { Controller, Post, Param } from '@nestjs/common';
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
}
