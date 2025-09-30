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
import { Logger, Inject } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/ws-auth.guard';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto, LoadMessageHistoryDto } from '../messages/dto';
import type {
  WebRTCOffer,
  WebRTCAnswer,
  ICECandidate,
  VideoCallRequest,
  VideoCallResponse,
} from '../webrtc/dto/webrtc.dto';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../common/providers/redis-client.provider';
import { User } from '../users/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  data: {
    user: User;
  };
}

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('VideoGateway');
  constructor(
    @Inject(REDIS_CLIENT) private redisClient: Redis,
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);
    } else {
      this.logger.log(`Client connected: ${client.id}`);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user) {
      this.logger.log(`Unauthenticated client disconnected: ${client.id}`);
      return;
    }
    this.logger.log(
      `Client disconnected: ${client.id}, User: ${user.username}`,
    );
    try {
      const userRooms = await this.roomsService.findRoomsByUserId(user.id);
      for (const room of userRooms) {
        await this.redisClient.srem(`room:${room.id}:users`, user.id);
        const participants = await this.redisClient.smembers(
          `room:${room.id}:users`,
        );
        this.server.to(room.id).emit('participantsUpdate', {
          roomId: room.id,
          participants,
        });
        this.logger.log(
          `Cleaned up user ${user.username} from room ${room.name}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error during disconnect cleanup: ${(error as Error).message}`,
      );
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    const { roomId } = data;

    this.logger.log(`User ${user.id} attempting to join room ${roomId}`);

    if (!user || !user.id) {
      this.logger.error('Join room attempted by unauthenticated user');
      void client.emit('joinRoomError', {
        roomId,
        error: 'User not authenticated',
      });
      return;
    }

    try {
      // 1. Add user to database first
      const updatedRoom = await this.roomsService.addUserToRoom(
        roomId,
        user.id,
      );
      this.logger.log(` User ${user.id} added to room ${roomId} in database`);

      // 2. Then join socket room
      client.join(roomId);
      this.logger.log(` Socket ${client.id} joined Socket.IO room ${roomId}`);

      // 3. Add user to Redis set
      await this.redisClient.sadd(`room:${roomId}:users`, user.id);

      // 4. Send success to the joining client FIRST
      void client.emit('joinRoomSuccess', {
        roomId,
        message: `Successfully joined room ${updatedRoom.name}`,
      });
      this.logger.log(` Sent joinRoomSuccess to client ${client.id}`);

      // 5. THEN broadcast to ALL room members (including the new joiner)
      const participants = await this.redisClient.smembers(
        `room:${roomId}:users`,
      );
      void this.server.to(roomId).emit('participantsUpdate', {
        roomId,
        participants,
      });
      this.logger.log(
        ` Broadcast participant update to room ${roomId} (${participants.length} participants)`,
      );
    } catch (error) {
      this.logger.error(` Error joining room: ${(error as Error).message}`);
      this.logger.error(` Stack trace: ${(error as Error).stack}`);
      void client.emit('joinRoomError', {
        roomId,
        error: (error as Error).message,
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    const { roomId } = data;

    if (!user) {
      this.logger.error('Leave room attempted by unauthenticated user');
      return;
    }

    this.logger.log(`User ${user.username} attempting to leave room ${roomId}`);

    try {
      // 1. Remove from database first
      const updatedRoom = await this.roomsService.removeUserFromRoom(
        roomId,
        user.id,
      );
      this.logger.log(
        ` User ${user.username} removed from room ${roomId} in database`,
      );

      // 2. Remove user from Redis set
      await this.redisClient.srem(`room:${roomId}:users`, user.id);

      // 3. Send success to the leaving client FIRST (while still in room)
      void client.emit('leaveRoomSuccess', {
        roomId,
        message: `Successfully left room ${updatedRoom.name}`,
      });

      // 4. Leave socket room
      client.leave(roomId);
      this.logger.log(` Socket ${client.id} left Socket.IO room ${roomId}`);

      // 5. THEN broadcast updated participants to remaining members
      const participants = await this.redisClient.smembers(
        `room:${roomId}:users`,
      );
      void this.server.to(roomId).emit('participantsUpdate', {
        roomId,
        participants,
      });
      this.logger.log(
        ` Broadcast participant update to room ${roomId} (${participants.length} remaining)`,
      );
    } catch (error) {
      this.logger.error(` Error leaving room: ${(error as Error).message}`);
      void client.emit('leaveRoomError', {
        roomId,
        error: (error as Error).message,
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    if (!user || !user.id) {
      this.logger.error('Message send attempted by unauthenticated user');
      void client.emit('messageError', {
        error: 'User not authenticated',
      });
      return;
    }
    this.logger.log(
      `User ${user.username} sending message to room ${createMessageDto.roomId}`,
    );
    try {
      // Remove messageType parameter to match your entity
      const message = await this.messagesService.create(
        createMessageDto.content,
        user.id,
        createMessageDto.roomId,
      );
      this.logger.log(` Message saved: ${message.id}`);

      // Remove messageType from payload to match your entity
      const messagePayload = {
        id: message.id,
        content: message.content,
        sender: {
          id: message.sender.id,
          username: message.sender.username,
          email: message.sender.email,
        },
        roomId: createMessageDto.roomId,
        timestamp: message.createdAt,
      };

      this.server
        .to(createMessageDto.roomId)
        .emit('newMessage', messagePayload);
      this.logger.log(
        ` Message broadcasted to room ${createMessageDto.roomId}`,
      );
      void client.emit('messageSent', {
        messageId: message.id,
        content: message.content,
      });
    } catch (error) {
      this.logger.error(` Error sending message: ${(error as Error).message}`);
      void client.emit('messageError', {
        error: (error as Error).message,
      });
    }
  }

  @SubscribeMessage('loadMessageHistory')
  async handleLoadMessageHistory(
    @MessageBody() loadHistoryDto: LoadMessageHistoryDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;
    if (!user || !user.id) {
      this.logger.error(
        'Message history load attempted by unauthenticated user',
      );
      return;
    }
    this.logger.log(
      `User ${user.username} loading message history for room ${loadHistoryDto.roomId}`,
    );
    try {
      const messages = await this.messagesService.findRecentByRoom(
        loadHistoryDto.roomId,
        loadHistoryDto.limit || 50,
      );

      // Remove messageType from formatted messages to match your entity
      const formattedMessages = messages.reverse().map((message) => ({
        id: message.id,
        content: message.content,
        sender: {
          id: message.sender.id,
          username: message.sender.username,
          email: message.sender.email,
        },
        roomId: loadHistoryDto.roomId,
        timestamp: message.createdAt,
      }));

      void client.emit('messageHistory', {
        roomId: loadHistoryDto.roomId,
        messages: formattedMessages,
      });
      this.logger.log(
        ` Sent ${formattedMessages.length} messages to ${user.username}`,
      );
    } catch (error) {
      this.logger.error(
        ` Error loading message history: ${(error as Error).message}`,
      );
      void client.emit('messageError', {
        error: (error as Error).message,
      });
    }
  }

  @SubscribeMessage('webrtc-call-user')
  async handleCallUser(
    @MessageBody() data: VideoCallRequest,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;

    if (!user) {
      this.logger.error('WebRTC call attempted by unauthenticated user');
      return;
    }

    this.logger.log(
      ` User ${user.username} calling user ${data.toUserId} in room ${data.roomId}`,
    );

    // Verify both users are in the same room
    try {
      const room = await this.roomsService.findOne(data.roomId);
      const userInRoom = room.participants.some((p) => p.id === user.id);
      const targetInRoom = room.participants.some(
        (p) => p.id === data.toUserId,
      );

      if (!userInRoom || !targetInRoom) {
        client.emit('webrtc-call-error', {
          error: 'Users must be in the same room to start video call',
        });
        return;
      }

      // Forward call request to target user
      this.server.to(data.roomId).emit('webrtc-incoming-call', {
        fromUserId: user.id,
        fromUsername: user.username,
        toUserId: data.toUserId,
        roomId: data.roomId,
      });

      this.logger.log(` Call request forwarded to user ${data.toUserId}`);
    } catch (error) {
      this.logger.error(` Error in call user: ${(error as Error).message}`);
      client.emit('webrtc-call-error', {
        error: 'Failed to initiate call',
      });
    }
  }

  @SubscribeMessage('webrtc-answer-call')
  handleAnswerCall(
    @MessageBody() data: VideoCallResponse,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;

    if (!user) {
      this.logger.error('WebRTC answer attempted by unauthenticated user');
      return;
    }

    this.logger.log(
      ` User ${user.username} ${data.accepted ? 'accepted' : 'rejected'} call from ${data.fromUserId}`,
    );

    // Forward response to caller
    this.server.to(data.roomId).emit('webrtc-call-answered', {
      fromUserId: data.fromUserId,
      toUserId: user.id,
      toUsername: user.username,
      roomId: data.roomId,
      accepted: data.accepted,
    });
  }

  @SubscribeMessage('webrtc-offer')
  handleWebRTCOffer(
    @MessageBody() data: WebRTCOffer,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;

    if (!user) {
      this.logger.error('WebRTC offer attempted by unauthenticated user');
      return;
    }

    this.logger.log(` WebRTC offer from ${user.username} to ${data.toUserId}`);

    // Forward offer to target user only
    this.server.to(data.roomId).emit('webrtc-offer-received', {
      ...data,
      fromUserId: user.id,
      fromUsername: user.username,
    });
  }

  @SubscribeMessage('webrtc-answer')
  handleWebRTCAnswer(
    @MessageBody() data: WebRTCAnswer,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;

    if (!user) {
      this.logger.error('WebRTC answer attempted by unauthenticated user');
      return;
    }

    this.logger.log(` WebRTC answer from ${user.username} to ${data.toUserId}`);

    // Forward answer to target user only
    this.server.to(data.roomId).emit('webrtc-answer-received', {
      ...data,
      fromUserId: user.id,
      fromUsername: user.username,
    });
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleICECandidate(
    @MessageBody() data: ICECandidate,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;

    if (!user) {
      this.logger.error('ICE candidate from unauthenticated user');
      return;
    }

    this.logger.log(` ICE candidate from ${user.username} to ${data.toUserId}`);

    // Forward ICE candidate to target user only
    this.server.to(data.roomId).emit('webrtc-ice-candidate-received', {
      ...data,
      fromUserId: user.id,
    });
  }

  @SubscribeMessage('webrtc-hang-up')
  handleHangUp(
    @MessageBody() data: { toUserId: string; roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;

    if (!user) {
      this.logger.error('Hang up attempted by unauthenticated user');
      return;
    }

    this.logger.log(
      ` User ${user.username} hanging up call with ${data.toUserId}`,
    );

    // Notify other user of hang up
    this.server.to(data.roomId).emit('webrtc-call-ended', {
      fromUserId: user.id,
      toUserId: data.toUserId,
      roomId: data.roomId,
    });
  }
}
