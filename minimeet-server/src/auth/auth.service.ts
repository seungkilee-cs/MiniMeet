import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async generateToken(userId: string): Promise<string> {
    const user = await this.usersService.findOne(userId);
    const payload = {
      sub: userId,
      username: user.username,
      email: user.email,
    };
    return this.jwtService.signAsync(payload);
  }

  async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      return null;
    }
  }
}
