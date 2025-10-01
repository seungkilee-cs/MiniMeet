import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
  ) {}

  async create(name: string, maxParticipants?: number): Promise<Room> {
    const room = this.roomsRepository.create({
      name,
      maxParticipants: maxParticipants || 4,
    });
    return this.roomsRepository.save(room);
  }

  async findAll(): Promise<Room[]> {
    return this.roomsRepository.find({
      relations: ['participants'],
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
    return room;
  }

  async addUserToRoom(roomId: string, userId: string): Promise<Room> {
    const room = await this.findOne(roomId);
    const user = await this.usersService.findOne(userId);

    // Check if room is at capacity
    if (room.participants.length >= room.maxParticipants) {
      throw new BadRequestException(`Room ${room.name} is at maximum capacity`);
    }

    // Check if user is already in room
    const isUserInRoom = room.participants.some(
      (participant) => participant.id === userId,
    );
    if (isUserInRoom) {
      throw new BadRequestException(
        `User ${user.username} is already in room ${room.name}`,
      );
    }

    room.participants.push(user);
    return this.roomsRepository.save(room);
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<Room> {
    // Ensure room exists (throws NotFoundException if not found)
    const room = await this.findOne(roomId);

    // Ensure user exists (throws NotFoundException if not found)
    const user = await this.usersService.findOne(userId);

    // Check if user is actually in the room
    const participantIndex = room.participants.findIndex(
      (participant) => participant.id === userId,
    );

    if (participantIndex === -1) {
      throw new BadRequestException(
        `User ${user.username} is not a participant in room ${room.name}`,
      );
    }

    // Remove the user from participants array
    room.participants.splice(participantIndex, 1);

    // Save updated room (this removes the entry from junction table)
    return this.roomsRepository.save(room);
  }

  async getRoomParticipants(roomId: string): Promise<User[]> {
    const room = await this.findOne(roomId);
    return room.participants;
  }

  async update(
    id: string,
    updateData: { name?: string; maxParticipants?: number },
  ): Promise<Room> {
    const room = await this.findOne(id);

    if (updateData.name !== undefined) {
      room.name = updateData.name;
    }
    if (updateData.maxParticipants !== undefined) {
      room.maxParticipants = updateData.maxParticipants;
    }

    return this.roomsRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomsRepository.remove(room);
  }

  async findRoomsByUserId(userId: string): Promise<Room[]> {
    return this.roomsRepository.find({
      where: {
        participants: {
          id: userId,
        },
      },
      relations: ['participants'],
    });
  }
}
