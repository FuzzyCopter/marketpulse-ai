import type { ChannelType } from './campaign.js';

export type OptimizeActionType =
  | 'adjust_bid'
  | 'pause_keyword'
  | 'enable_keyword'
  | 'adjust_budget'
  | 'pause_campaign'
  | 'change_ad_schedule';

export type OptimizeRuleStatus = 'active' | 'paused' | 'draft';
export type ActionLogStatus = 'pending' | 'executed' | 'failed' | 'rolled_back';

export interface OptimizeRule {
  id: number;
  tenantId: number;
  campaignId: number;
  name: string;
  description: string;
  channelType: ChannelType | null;
  // Condition
  metric: string;           // 'cpc' | 'ctr' | 'quality_score' | 'conversions' | 'cost' | 'clicks'
  condition: 'above' | 'below' | 'change_pct_up' | 'change_pct_down';
  threshold: number;
  lookbackDays: number;     // how many days to evaluate
  // Action
  actionType: OptimizeActionType;
  actionParams: Record<string, unknown>;  // e.g. { adjustPercent: -10 } or { newBid: 1500 }
  // Status
  status: OptimizeRuleStatus;
  lastEvaluatedAt: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
}

export interface ActionLog {
  id: number;
  tenantId: number;
  ruleId: number | null;     // null = manual action
  campaignId: number;
  actionType: OptimizeActionType;
  targetEntity: string;      // 'keyword:5' or 'campaign:1'
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  reason: string;
  status: ActionLogStatus;
  executedAt: string;
  executedBy: 'ai' | 'rule' | 'manual';
  userId: number | null;     // who approved/triggered
}

export interface OptimizeSuggestion {
  id: string;
  campaignId: number;
  actionType: OptimizeActionType;
  targetEntity: string;
  currentValue: Record<string, unknown>;
  suggestedValue: Record<string, unknown>;
  reason: string;
  expectedImpact: string;
  confidence: number;        // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: 'ai' | 'rule';
  createdAt: string;
}
