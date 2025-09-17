import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Get('room/:roomId')
  findByRoom(@Param('roomId') roomId: string, @Query('limit') limit?: string) {
    const messageLimit = limit ? parseInt(limit, 10) : 50;
    return this.messagesService.findRecentByRoom(roomId, messageLimit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }
}
