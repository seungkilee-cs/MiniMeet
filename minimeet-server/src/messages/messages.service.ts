import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
    private roomsService: RoomsService,
    private searchService: SearchService,
  ) {}

  async create(
    content: string,
    senderId: string,
    roomId: string,
  ): Promise<Message> {
    // Validate sender and room exist
    const sender = await this.usersService.findOne(senderId);
    const room = await this.roomsService.findOne(roomId);

    // Create new message
    const message = this.messagesRepository.create({
      content,
      sender,
      room,
    });

    const savedMessage = await this.messagesRepository.save(message);

    // Index the message for search (async, don't wait)
    this.searchService.indexMessage({
      id: savedMessage.id,
      content: savedMessage.content,
      sender: {
        id: savedMessage.sender.id,
        username: savedMessage.sender.username,
        email: savedMessage.sender.email,
      },
      roomId: savedMessage.room.id,
      createdAt: savedMessage.createdAt,
    }).catch((error) => {
      // Log error but don't fail the message creation
      console.error('Failed to index message:', error);
    });

    return savedMessage;
  }

  async findRecentByRoom(
    roomId: string,
    limit: number = 50,
  ): Promise<Message[]> {
    const messages = await this.messagesRepository.find({
      where: { room: { id: roomId }, isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['sender', 'room'],
    });

    return messages;
  }

  async findAll(): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { isActive: true },
      relations: ['sender', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id, isActive: true },
      relations: ['sender', 'room'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }
}
