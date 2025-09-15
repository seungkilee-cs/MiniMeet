import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async create(
    @Body() createRoomDto: { name: string; maxParticipants?: number },
  ) {
    return this.roomsService.create(
      createRoomDto.name,
      createRoomDto.maxParticipants,
    );
  }

  @Get()
  async findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Post(':id/participants')
  async addParticipant(
    @Param('id') roomId: string,
    @Body() addParticipantDto: { userId: string },
  ) {
    return this.roomsService.addUserToRoom(roomId, addParticipantDto.userId);
  }

  @Delete(':id/participants/:userId')
  async removeParticipant(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
  ) {
    return this.roomsService.removeUserFromRoom(roomId, userId);
  }

  @Get(':id/participants')
  async getParticipants(@Param('id') roomId: string) {
    return this.roomsService.getRoomParticipants(roomId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
