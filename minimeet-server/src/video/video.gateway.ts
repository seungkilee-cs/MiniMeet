// NestJS hooks to run the code when a user connects or disconnects

import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';

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

  constructor(private readonly roomsService: RoomsService) {}

  /* keep track of which user belongs to which socket, temporarilyi use in-memory map. fine for now. */
  private connectedUsers: Map<string, string> = new Map();

  /**
   * a new client establishes a connection.
   * what do I pass in here -> client should be Socket object beacuse the socket object representing the connected client.
   * @param client socket object == connected client
   *
   * Now, let's store the user. For now, let's assume it's passed in the handshake.
   * I would get the userId from an authentication step later, and would update the hard coded map later
   */

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(client.id, userId);
      this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);
    } else {
      this.logger.log(`Client connected: ${client.id}`);
    }
  }

  /**
   * a connected client disconnects
   * Do I need any other param other than client? -> if this is socket obj than this should be all I need for the logic
   * @param client socket object == connected client
   */
  async handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);

    if (userId) {
      /** Find all rooms the user is in and remove them.
       * I guess I have to add a new method to RoomsService for this to work.
       * like -> this.roomsService.removeUserFromAllRooms(userId);
       * Then I can just iterate through those rooms and emit updates.
       */
      this.connectedUsers.delete(client.id);
    }
  }
  /**
   * Handles the 'joinRoom' event from a client.
   * @param data The payload from the client, containing roomId and userId.
   * @param client The socket of the client that sent the event.
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = data;
    this.logger.log(`User ${userId} attempting to join room ${roomId}`);

    try {
      // 1. Add the socket to the Socket.IO room
      client.join(roomId);
      this.logger.log(`✅ Socket ${client.id} joined Socket.IO room ${roomId}`);

      // 2. Update the database via RoomsService
      const updatedRoom = await this.roomsService.addUserToRoom(roomId, userId);
      this.logger.log(`✅ User ${userId} added to room ${roomId} in database`);

      // 3. Broadcast the updated participant list to all clients in this room
      this.server.to(roomId).emit('participantsUpdate', {
        roomId,
        participants: updatedRoom.participants,
      });
      this.logger.log(`✅ Broadcast participant update to room ${roomId}`);

      // 4. Confirm successful join to the requesting client
      client.emit('joinRoomSuccess', {
        roomId,
        message: `Successfully joined room ${updatedRoom.name}`,
      });
      this.logger.log(`✅ Sent joinRoomSuccess to client ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ Error joining room: ${error.message}`);
      this.logger.error(`❌ Stack trace: ${error.stack}`);

      // Send error back to the specific client
      client.emit('joinRoomError', {
        roomId,
        error: error.message,
      });
    }
  }
  /**
   * Handles the 'leaveRoom' event from a client.
   * @param data The payload from the client, containing roomId and userId.
   * @param client The socket of the client that sent the event.
   */
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = data;
    this.logger.log(`User ${userId} attempting to leave room ${roomId}`);

    client.leave(roomId);
    const room = await this.roomsService.removeUserFromRoom(roomId, userId);
    this.server.to(roomId).emit('participantsUpdate', room.participants);
  }
}
