import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const activity = await this.analyticsService.getUserActivity(
      userId,
      daysNum,
    );

    return {
      userId,
      days: daysNum,
      eventCount: activity.length,
      events: activity,
    };
  }

  @Get('room/:roomId')
  async getRoomAnalytics(
    @Param('roomId') roomId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getRoomAnalytics(roomId, daysNum);
  }

  @Get('call/:callId/quality')
  async getCallQuality(@Param('callId') callId: string) {
    const stats = await this.analyticsService.getCallQualityStats(callId);
    
    if (!stats) {
      return {
        callId,
        message: 'No quality data available for this call',
      };
    }

    return stats;
  }

  @Get('dashboard')
  async getDashboard(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.analyticsService.getDashboardMetrics(daysNum);
  }

  @Post('call-metrics')
  async recordCallMetrics(@Body() metrics: any) {
    await this.analyticsService.recordCallMetrics(metrics);
    return { success: true, message: 'Metrics recorded' };
  }
}
