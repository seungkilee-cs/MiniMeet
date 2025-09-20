import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { jwtConstants } from './constants';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // guard should only run on WebSocket contexts
    if (context.getType() !== 'ws') {
      return false;
    }

    const client: Socket = context.switchToWs().getClient<Socket>();

    try {
      // extract token from multiple possible locations
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`No token provided for socket ${client.id}`);
        throw new WsException('No authentication token provided');
      }

      // verify the JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      // token expiration handling
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new WsException('Token expired');
      }

      // attach user information to socket for later use
      client.data.user = {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
      };

      this.logger.log(`Setting user data: ${JSON.stringify(client.data.user)}`);

      this.logger.log(
        `User ${payload.username} authenticated for socket ${client.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Authentication failed for socket ${client.id}: ${error.message}`,
      );

      // emit error to client before disconnecting
      client.emit('authError', {
        message: 'Authentication failed',
        error: error.message,
      });

      client.disconnect();

      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: Socket): string | null {
    // check auth object in handshake
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    // or authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    // or  query param
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }
}
