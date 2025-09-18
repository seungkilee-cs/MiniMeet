import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  ANNOUNCEMENT = 'announcement',
}

export class CreateMessageDto {
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @MinLength(1, { message: 'Message too short' })
  @MaxLength(500, { message: 'Message too long (max 500 characters)' })
  content: string;

  @IsString({ message: 'Room ID must be a string' })
  @IsNotEmpty({ message: 'Room ID is required' })
  roomId: string;
}
