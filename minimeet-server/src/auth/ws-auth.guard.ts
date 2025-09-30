import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { jwtConstants } from './constants';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  exp?: number;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user: Partial<User>;
  };
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // guard should only run on WebSocket contexts
    if (context.getType() !== 'ws') {
      return false;
    }

    const client: AuthenticatedSocket = context
      .switchToWs()
      .getClient<AuthenticatedSocket>();

    try {
      // extract token from multiple possible locations
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`No token provided for socket ${client.id}`);
        throw new WsException('No authentication token provided');
      }

      // verify the JWT token
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      // token expiration handling
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new WsException('Token expired');
      }

      // attach user information to socket for later use
      client.data = {
        user: {
          id: payload.sub,
          username: payload.username,
          email: payload.email,
        },
      };

      this.logger.log(`Setting user data: ${JSON.stringify(client.data.user)}`);

      this.logger.log(
        `User ${payload.username} authenticated for socket ${client.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Authentication failed for socket ${client.id}: ${(error as Error).message}`,
      );

      // emit error to client before disconnecting
      client.emit('authError', {
        message: 'Authentication failed',
        error: (error as Error).message,
      });

      client.disconnect();

      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    // check auth object in handshake
    const { token: authToken } = client.handshake.auth || {};
    if (typeof authToken === 'string') {
      return authToken;
    }

    // or authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && typeof token === 'string') {
        return token;
      }
    }

    // or  query param
    const { token: queryToken } = client.handshake.query || {};
    if (typeof queryToken === 'string') {
      return queryToken;
    }
    if (Array.isArray(queryToken) && typeof queryToken[0] === 'string') {
      return queryToken[0];
    }

    return null;
  }
}
