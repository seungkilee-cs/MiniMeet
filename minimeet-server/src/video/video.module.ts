import { Module } from '@nestjs/common';
import { VideoGateway } from './video.gateway';
import { RoomsModule } from '../rooms/rooms.module';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from '../auth/auth.module';
import { redisClientProvider } from '../common/providers/redis-client.provider';

@Module({
  imports: [RoomsModule, MessagesModule, AuthModule],
  providers: [VideoGateway, redisClientProvider],
})
export class VideoModule {}
