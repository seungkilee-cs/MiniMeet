import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CallMetricsDocument = CallMetrics & Document;

@Schema({ timestamps: true, collection: 'call_metrics' })
export class CallMetrics {
  @Prop({ required: true, index: true })
  callId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  roomId: string;

  @Prop({ type: Object })
  videoStats: {
    bitrate?: number;
    packetLoss?: number;
    jitter?: number;
    rtt?: number;
    resolution?: string;
    fps?: number;
    codec?: string;
  };

  @Prop({ type: Object })
  audioStats: {
    bitrate?: number;
    packetLoss?: number;
    jitter?: number;
    codec?: string;
  };

  @Prop({ type: Object })
  networkStats: {
    connectionType?: string;
    bandwidth?: number;
    latency?: number;
  };

  @Prop({ type: Date, index: true, default: Date.now })
  timestamp: Date;
}

export const CallMetricsSchema = SchemaFactory.createForClass(CallMetrics);

// Indexes for time-series queries
CallMetricsSchema.index({ callId: 1, timestamp: -1 });
CallMetricsSchema.index({ userId: 1, timestamp: -1 });
CallMetricsSchema.index({ roomId: 1, timestamp: -1 });
