import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
} from './schemas/analytics-event.schema';
import {
  CallMetrics,
  CallMetricsDocument,
} from './schemas/call-metrics.schema';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
    @InjectModel(CallMetrics.name)
    private readonly metricsModel: Model<CallMetricsDocument>,
  ) {}

  /**
   * Track a generic analytics event
   */
  async trackEvent(
    eventType: string,
    userId: string,
    roomId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.eventModel.create({
        eventType,
        userId,
        roomId,
        metadata: metadata || {},
        timestamp: new Date(),
      });

      this.logger.debug(
        `Tracked event: ${eventType} for user ${userId}${roomId ? ` in room ${roomId}` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to track event: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Track room join event
   */
  async trackRoomJoin(
    userId: string,
    roomId: string,
    metadata?: any,
  ): Promise<void> {
    await this.trackEvent('room_join', userId, roomId, metadata);
  }

  /**
   * Track room leave event
   */
  async trackRoomLeave(
    userId: string,
    roomId: string,
    duration?: number,
  ): Promise<void> {
    await this.trackEvent('room_leave', userId, roomId, { duration });
  }

  /**
   * Track message sent event
   */
  async trackMessageSent(
    userId: string,
    roomId: string,
    messageLength: number,
  ): Promise<void> {
    await this.trackEvent('message_sent', userId, roomId, {
      messageLength,
    });
  }

  /**
   * Track call started event
   */
  async trackCallStarted(
    userId: string,
    roomId: string,
    callId: string,
    participants: string[],
  ): Promise<void> {
    await this.trackEvent('call_started', userId, roomId, {
      callId,
      participantCount: participants.length,
      participants,
    });
  }

  /**
   * Track call ended event
   */
  async trackCallEnded(
    userId: string,
    roomId: string,
    callId: string,
    duration: number,
  ): Promise<void> {
    await this.trackEvent('call_ended', userId, roomId, {
      callId,
      duration,
    });
  }

  /**
   * Record call quality metrics
   */
  async recordCallMetrics(metrics: {
    callId: string;
    userId: string;
    roomId: string;
    videoStats?: any;
    audioStats?: any;
    networkStats?: any;
  }): Promise<void> {
    try {
      await this.metricsModel.create({
        ...metrics,
        timestamp: new Date(),
      });

      this.logger.debug(`Recorded call metrics for call ${metrics.callId}`);
    } catch (error) {
      this.logger.error(
        `Failed to record call metrics: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get user activity for the last N days
   */
  async getUserActivity(userId: string, days: number = 30): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.eventModel
      .find({
        userId,
        timestamp: { $gte: since },
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .exec();
  }

  /**
   * Get room analytics
   */
  async getRoomAnalytics(roomId: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await this.eventModel
      .find({
        roomId,
        timestamp: { $gte: since },
      })
      .exec();

    const joins = events.filter((e) => e.eventType === 'room_join');
    const messages = events.filter((e) => e.eventType === 'message_sent');
    const calls = events.filter((e) => e.eventType === 'call_started');

    return {
      totalJoins: joins.length,
      totalMessages: messages.length,
      totalCalls: calls.length,
      uniqueUsers: new Set(events.map((e) => e.userId)).size,
      events: events.slice(0, 50), // Last 50 events
    };
  }

  /**
   * Get call quality statistics
   */
  async getCallQualityStats(callId: string): Promise<any> {
    const metrics = await this.metricsModel
      .find({ callId })
      .sort({ timestamp: 1 })
      .exec();

    if (metrics.length === 0) {
      return null;
    }

    // Calculate averages
    const avgVideoStats = this.calculateAverageStats(
      metrics.map((m) => m.videoStats),
    );
    const avgAudioStats = this.calculateAverageStats(
      metrics.map((m) => m.audioStats),
    );

    return {
      callId,
      dataPoints: metrics.length,
      duration: metrics.length > 1
        ? (metrics[metrics.length - 1].timestamp.getTime() -
            metrics[0].timestamp.getTime()) /
          1000
        : 0,
      averageVideoStats: avgVideoStats,
      averageAudioStats: avgAudioStats,
      timeline: metrics.map((m) => ({
        timestamp: m.timestamp,
        videoStats: m.videoStats,
        audioStats: m.audioStats,
      })),
    };
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(days: number = 7): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await this.eventModel
      .find({ timestamp: { $gte: since } })
      .exec();

    const eventsByType = events.reduce(
      (acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const eventsByDay = this.groupByDay(events);
    const topRooms = this.getTopRooms(events, 10);
    const activeUsers = new Set(events.map((e) => e.userId)).size;

    return {
      totalEvents: events.length,
      activeUsers,
      eventsByType,
      eventsByDay,
      topRooms,
    };
  }

  private calculateAverageStats(statsArray: any[]): any {
    const validStats = statsArray.filter((s) => s && Object.keys(s).length > 0);
    if (validStats.length === 0) return {};

    const keys = Object.keys(validStats[0]);
    const averages: any = {};

    keys.forEach((key) => {
      const values = validStats
        .map((s) => s[key])
        .filter((v) => typeof v === 'number');
      if (values.length > 0) {
        averages[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    });

    return averages;
  }

  private groupByDay(events: any[]): Record<string, number> {
    return events.reduce(
      (acc, event) => {
        const day = event.timestamp.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private getTopRooms(events: any[], limit: number): any[] {
    const roomCounts = events.reduce(
      (acc, event) => {
        if (event.roomId) {
          acc[event.roomId] = (acc[event.roomId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(roomCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([roomId, count]) => ({ roomId, eventCount: count }));
  }
}
