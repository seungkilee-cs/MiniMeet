// NestJS hooks to run the code when a user connects or disconnects

import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  // cors for connecting frontend on different port
  cors: {
    origin: '*', // For development purposes only. In production, let's not do this.
  },
})
export class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // decorator to inject to get access to the underlying Socket.io server instance. Use to send msg
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('VideoGateway');

  /**
   * a new client establishes a connection.
   * what do I pass in here -> client should be Socket object beacuse the socket object representing the connected client.
   * @param client socket object == connected client
   */
  handleConnection(client: Socket) {
    // This is where you add your console.log statement.
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * a connected client disconnects
   * Do I need any other param other than client? -> if this is socket obj than this should be all I need for the logic
   * @param client socket object == connected client
   */
  handleDisconnect(client: Socket) {
    // This is where you add your console.log statement.
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
