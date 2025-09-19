import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { VideoGateway } from './video/video.gateway';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'minimeet',
      autoLoadEntities: true,
      synchronize: true, // Only for development
      logging: true, // Shows SQL queries in console
    }),
    UsersModule,
    RoomsModule,
    AuthModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService, VideoGateway],
})
export class AppModule {}
