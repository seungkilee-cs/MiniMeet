import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('messages')
  async searchMessages(
    @Query('q') query: string,
    @Query('roomId') roomId?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      return {
        results: [],
        message: 'Query parameter "q" is required',
      };
    }

    const limitNum = limit ? parseInt(limit, 10) : 50;
    const results = await this.searchService.searchMessages(
      query,
      roomId,
      limitNum,
    );

    return {
      query,
      roomId: roomId || 'all',
      resultCount: results.length,
      results,
    };
  }

  @Get('users')
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      return {
        results: [],
        message: 'Query parameter "q" is required',
      };
    }

    const limitNum = limit ? parseInt(limit, 10) : 20;
    const results = await this.searchService.searchUsers(query, limitNum);

    return {
      query,
      resultCount: results.length,
      results,
    };
  }

  @Get('rooms')
  async searchRooms(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      return {
        results: [],
        message: 'Query parameter "q" is required',
      };
    }

    const limitNum = limit ? parseInt(limit, 10) : 20;
    const results = await this.searchService.searchRooms(query, limitNum);

    return {
      query,
      resultCount: results.length,
      results,
    };
  }
}
