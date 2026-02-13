export type CampaignStatus = 'draft' | 'upcoming' | 'active' | 'paused' | 'completed';
export type ChannelType = 'google_search' | 'google_discovery' | 'social_tiktok' | 'social_instagram' | 'social_facebook';
export type MetricGranularity = 'hourly' | 'daily' | 'weekly';

export interface Campaign {
  id: number;
  tenantId: number;
  clientId: number;
  name: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  budget: CampaignBudget | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignBudget {
  total: number;
  currency: string;
  breakdown?: Record<ChannelType, number>;
}

export interface CampaignChannel {
  id: number;
  tenantId: number;
  campaignId: number;
  channelType: ChannelType;
  isActive: boolean;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface KPITarget {
  id: number;
  tenantId: number;
  campaignId: number;
  channelId: number | null;
  metricName: string;
  targetValue: number;
  targetUnit: 'count' | 'percentage' | 'currency';
  period: 'daily' | 'weekly' | 'campaign';
  createdAt: string;
}
