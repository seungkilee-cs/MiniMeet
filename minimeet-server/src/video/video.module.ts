import { Module } from '@nestjs/common';
import { VideoGateway } from './video.gateway';
import { RoomsModule } from '../rooms/rooms.module';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { redisClientProvider } from '../common/providers/redis-client.provider';
import { SocketMappingService } from '../common/services/socket-mapping.service';

@Module({
  imports: [RoomsModule, MessagesModule, AuthModule, UsersModule],
  providers: [VideoGateway, redisClientProvider, SocketMappingService],
})
export class VideoModule {}
