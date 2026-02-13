import type { ChannelType } from './campaign.js';

export type AlertCondition = 'above' | 'below' | 'change_pct';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'positive';
export type InsightType = 'performance_summary' | 'anomaly' | 'recommendation' | 'trend';

export interface AlertRule {
  id: number;
  tenantId: number;
  campaignId: number | null;
  name: string;
  metricName: string;
  condition: AlertCondition;
  threshold: number;
  channelType: ChannelType | null;
  notification: {
    email?: boolean;
    inApp?: boolean;
    webhook?: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface AlertEvent {
  id: number;
  tenantId: number;
  ruleId: number;
  campaignId: number | null;
  triggeredAt: string;
  metricValue: number;
  thresholdValue: number;
  message: string;
  isAcknowledged: boolean;
  acknowledgedBy: number | null;
}

export interface AIInsight {
  id: number;
  tenantId: number;
  campaignId: number;
  insightType: InsightType;
  title: string;
  content: string;
  severity: AlertSeverity;
  dataContext: Record<string, unknown> | null;
  isRead: boolean;
  isDismissed: boolean;
  generatedAt: string;
  expiresAt: string | null;
}
