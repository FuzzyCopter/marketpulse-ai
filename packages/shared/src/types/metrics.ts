import type { ChannelType, MetricGranularity } from './campaign.js';

export interface DailyMetric {
  id: number;
  tenantId: number;
  campaignId: number;
  channelId: number;
  channelType?: ChannelType;
  metricDate: string;
  impressions: number;
  clicks: number;
  visits: number;
  conversions: number;
  cost: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  qualityScore: number | null;
  extraMetrics: Record<string, number>;
}

export interface MetricTotals {
  impressions: number;
  clicks: number;
  visits: number;
  conversions: number;
  cost: number;
  avgCtr: number;
  avgCpc: number;
  avgConversionRate: number;
}

export interface MetricsQuery {
  campaignId: number;
  channelType?: ChannelType;
  startDate: string;
  endDate: string;
  granularity: MetricGranularity;
}

export interface MetricsResult {
  data: DailyMetric[];
  totals: MetricTotals;
  meta: {
    source: 'mock' | 'live';
    fetchedAt: string;
    cacheKey?: string;
  };
}

export interface KPIProgress {
  metricName: string;
  target: number;
  actual: number;
  percentage: number;
  trend: 'up' | 'down' | 'flat';
  onTrack: boolean;
  projected: number;
  daysRemaining: number;
}

export interface DashboardOverview {
  campaign: {
    id: number;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    daysElapsed: number;
    totalDays: number;
  };
  kpis: KPIProgress[];
  channelBreakdown: ChannelMetrics[];
  todayMetrics: MetricTotals;
  weekMetrics: MetricTotals;
}

export interface ChannelMetrics {
  channelType: ChannelType;
  label: string;
  metrics: MetricTotals;
  target: number;
  targetMetric: string;
  progress: number;
}

export interface SEMKeyword {
  id: number;
  tenantId: number;
  campaignId: number;
  channelId: number;
  keyword: string;
  matchType: 'exact' | 'phrase' | 'broad';
  status: 'active' | 'paused' | 'removed';
  maxCpc: number | null;
  qualityScore: number | null;
  adGroup: string | null;
}

export interface SEMKeywordMetric {
  id: number;
  keywordId: number;
  metricDate: string;
  impressions: number;
  clicks: number;
  cost: number;
  ctr: number;
  avgCpc: number;
  avgPosition: number | null;
  conversions: number;
  qualityScore: number | null;
}

export interface SEORanking {
  id: number;
  tenantId: number;
  campaignId: number;
  keyword: string;
  url: string | null;
  position: number | null;
  previousPosition: number | null;
  searchVolume: number | null;
  difficulty: number | null;
  metricDate: string;
}

export interface SEOPageAudit {
  id: number;
  tenantId: number;
  campaignId: number;
  url: string;
  pageScore: number | null;
  loadTimeMs: number | null;
  mobileScore: number | null;
  issues: SEOIssue[];
  auditDate: string;
}

export interface SEOIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}
