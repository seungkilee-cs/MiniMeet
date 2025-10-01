import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: Client;

  constructor(private readonly configService: ConfigService) {
    const esUrl =
      this.configService.get<string>('ELASTICSEARCH_URL') ||
      'http://localhost:9200';

    this.client = new Client({
      node: esUrl,
      // Disable version check for compatibility
      // This allows the v8 client to work with Elasticsearch 8.x
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('Connected to Elasticsearch');
      await this.ensureIndexes();
    } catch (error) {
      this.logger.error(
        `Failed to connect to Elasticsearch: ${(error as Error).message}`,
      );
    }
  }

  private async ensureIndexes() {
    // Create messages index if it doesn't exist
    const messagesExists = await this.client.indices.exists({
      index: 'messages',
    });

    if (!messagesExists) {
      await this.client.indices.create({
        index: 'messages',
        mappings: {
          properties: {
            content: { type: 'text' },
            senderId: { type: 'keyword' },
            senderUsername: { type: 'text' },
            senderEmail: { type: 'keyword' },
            roomId: { type: 'keyword' },
            timestamp: { type: 'date' },
          },
        },
      } as any);
      this.logger.log('Created messages index');
    }

    // Create users index if it doesn't exist
    const usersExists = await this.client.indices.exists({ index: 'users' });

    if (!usersExists) {
      await this.client.indices.create({
        index: 'users',
        mappings: {
          properties: {
            id: { type: 'keyword' },
            username: { type: 'text' },
            email: { type: 'keyword' },
          },
        },
      } as any);
      this.logger.log('Created users index');
    }

    // Create rooms index if it doesn't exist
    const roomsExists = await this.client.indices.exists({ index: 'rooms' });

    if (!roomsExists) {
      await this.client.indices.create({
        index: 'rooms',
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text' },
            maxParticipants: { type: 'integer' },
            createdAt: { type: 'date' },
          },
        },
      } as any);
      this.logger.log('Created rooms index');
    }
  }

  /**
   * Index a message for search
   */
  async indexMessage(message: any): Promise<void> {
    try {
      await this.client.index({
        index: 'messages',
        id: message.id,
        document: {
          content: message.content,
          senderId: message.sender.id,
          senderUsername: message.sender.username,
          senderEmail: message.sender.email,
          roomId: message.roomId,
          timestamp: message.createdAt,
        },
      });

      this.logger.debug(`Indexed message ${message.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to index message: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Search messages with full-text search
   */
  async searchMessages(
    query: string,
    roomId?: string,
    limit: number = 50,
  ): Promise<any[]> {
    try {
      const must: any[] = [
        {
          multi_match: {
            query,
            fields: ['content^2', 'senderUsername'],
            fuzziness: 'AUTO',
          },
        },
      ];

      if (roomId) {
        must.push({ term: { roomId } });
      }

      const result = await this.client.search({
        index: 'messages',
        query: { bool: { must } },
        highlight: {
          fields: {
            content: {
              pre_tags: ['<mark>'],
              post_tags: ['</mark>'],
            },
          },
        },
        sort: [{ timestamp: { order: 'desc' } }],
        size: limit,
      } as any);

      return result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        highlights: hit.highlight,
        score: hit._score,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to search messages: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Index a user for search
   */
  async indexUser(user: any): Promise<void> {
    try {
      await this.client.index({
        index: 'users',
        id: user.id,
        document: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });

      this.logger.debug(`Indexed user ${user.id}`);
    } catch (error) {
      this.logger.error(`Failed to index user: ${(error as Error).message}`);
    }
  }

  /**
   * Search users by username or email
   */
  async searchUsers(query: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.client.search({
        index: 'users',
        query: {
          multi_match: {
            query,
            fields: ['username^2', 'email'],
            fuzziness: 'AUTO',
          },
        },
        size: limit,
      } as any);

      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error(`Failed to search users: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Index a room for search
   */
  async indexRoom(room: any): Promise<void> {
    try {
      await this.client.index({
        index: 'rooms',
        id: room.id,
        document: {
          id: room.id,
          name: room.name,
          maxParticipants: room.maxParticipants,
          createdAt: room.createdAt,
        },
      });

      this.logger.debug(`Indexed room ${room.id}`);
    } catch (error) {
      this.logger.error(`Failed to index room: ${(error as Error).message}`);
    }
  }

  /**
   * Search rooms by name
   */
  async searchRooms(query: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.client.search({
        index: 'rooms',
        query: {
          match: {
            name: {
              query,
              fuzziness: 'AUTO',
            },
          },
        },
        size: limit,
      } as any);

      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error(`Failed to search rooms: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Delete a message from index
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.client.delete({
        index: 'messages',
        id: messageId,
      });

      this.logger.debug(`Deleted message ${messageId} from index`);
    } catch (error) {
      this.logger.error(
        `Failed to delete message from index: ${(error as Error).message}`,
      );
    }
  }
}
