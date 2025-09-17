import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
    private roomsService: RoomsService,
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

    return this.messagesRepository.save(message);
  }

  async findRecentByRoom(
    roomId: string,
    limit: number = 50,
  ): Promise<Message[]> {
    const room = await this.roomsService.findOne(roomId);

    return this.messagesRepository.find({
      where: { room: { id: roomId }, isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['sender', 'room'],
    });
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
