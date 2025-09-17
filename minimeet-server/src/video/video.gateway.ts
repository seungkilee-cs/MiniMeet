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
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/ws-auth.guard';

@UseGuards(WsAuthGuard) // Apply guard to the whole gateway
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
    const user = client.data.user;

    if (!user) {
      this.logger.log(`Unauthenticated client disconnected: ${client.id}`);
      return;
    }

    this.logger.log(
      `Client disconnected: ${client.id}, User: ${user.username}`,
    );

    try {
      // Find all rooms user is in and remove them
      const userRooms = await this.roomsService.findRoomsByUserId(user.id);

      for (const room of userRooms) {
        await this.roomsService.removeUserFromRoom(room.id, user.id);

        // Broadcast to remaining users in each room
        const updatedRoom = await this.roomsService.findOne(room.id);
        this.server.to(room.id).emit('participantsUpdate', {
          roomId: room.id,
          participants: updatedRoom.participants,
        });

        this.logger.log(
          `Cleaned up user ${user.username} from room ${room.name}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error during disconnect cleanup: ${error.message}`);
    }
  }
  /**
   * Handles the 'joinRoom' event from a client.
   * @param data The payload from the client, containing roomId and userId.
   * @param client The socket of the client that sent the event.
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const { roomId } = data;
    this.logger.log(`User ${user.id} attempting to join room ${roomId}`);

    if (!user || !user.id) {
      this.logger.error('Join room attempted by unauthenticated user');
      client.emit('joinRoomError', {
        roomId,
        error: 'User not authenticated',
      });
      return;
    }

    this.logger.log(`User from socket: ${user}`);

    try {
      // 1. Add the socket to the Socket.IO room
      client.join(roomId);
      this.logger.log(`✅ Socket ${client.id} joined Socket.IO room ${roomId}`);

      // 2. Update the database via RoomsService
      const updatedRoom = await this.roomsService.addUserToRoom(
        roomId,
        user.id,
      );
      this.logger.log(`✅ User ${user.id} added to room ${roomId} in database`);

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
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const { roomId } = data;

    if (!user) {
      this.logger.error('Leave room attempted by unauthenticated user');
      return;
    }

    this.logger.log(`User ${user.username} attempting to leave room ${roomId}`);

    try {
      // 1. Update database FIRST
      const updatedRoom = await this.roomsService.removeUserFromRoom(
        roomId,
        user.id,
      );
      this.logger.log(
        `✅ User ${user.username} removed from room ${roomId} in database`,
      );

      // 2. Broadcast to ALL users in room (INCLUDING the leaving user)
      this.server.to(roomId).emit('participantsUpdate', {
        roomId,
        participants: updatedRoom.participants,
      });
      this.logger.log(`✅ Broadcast participant update to room ${roomId}`);

      // 3. THEN remove socket from Socket.IO room
      client.leave(roomId);
      this.logger.log(`✅ Socket ${client.id} left Socket.IO room ${roomId}`);

      // 4. Confirm successful leave to the client
      client.emit('leaveRoomSuccess', {
        roomId,
        message: `Successfully left room ${updatedRoom.name}`,
      });
    } catch (error) {
      this.logger.error(`❌ Error leaving room: ${error.message}`);
      client.emit('leaveRoomError', {
        roomId,
        error: error.message,
      });
    }
  }
}
