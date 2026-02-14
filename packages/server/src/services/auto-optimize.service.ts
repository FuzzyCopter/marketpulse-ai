import type { OptimizeRule, ActionLog, OptimizeSuggestion } from '@marketpulse/shared';
import { getSearchAdsProvider } from '../datasources/index.js';

// In-memory storage (replaced by DB in production)
const rules: OptimizeRule[] = [];
const actionLogs: ActionLog[] = [];
const suggestions: OptimizeSuggestion[] = [];
let nextRuleId = 1;
let nextLogId = 1;

// === Default Rules for Honda MBBH ===
function initDefaultRules(): void {
  if (rules.length > 0) return;

  const defaults: Omit<OptimizeRule, 'id' | 'createdAt' | 'lastEvaluatedAt' | 'lastTriggeredAt'>[] = [
    {
      tenantId: 1,
      campaignId: 1,
      name: 'CPC Terlalu Tinggi - Auto Turunkan Bid',
      description: 'Otomatis turunkan bid 10% jika CPC keyword di atas Rp 2.000',
      channelType: 'google_search',
      metric: 'cpc',
      condition: 'above',
      threshold: 2000,
      lookbackDays: 3,
      actionType: 'adjust_bid',
      actionParams: { adjustPercent: -10 },
      status: 'active',
    },
    {
      tenantId: 1,
      campaignId: 1,
      name: 'Quality Score Rendah - Pause Keyword',
      description: 'Otomatis pause keyword dengan QS di bawah 4',
      channelType: 'google_search',
      metric: 'quality_score',
      condition: 'below',
      threshold: 4,
      lookbackDays: 7,
      actionType: 'pause_keyword',
      actionParams: {},
      status: 'active',
    },
    {
      tenantId: 1,
      campaignId: 1,
      name: 'CTR Rendah - Turunkan Bid',
      description: 'Turunkan bid 15% jika CTR keyword di bawah 2%',
      channelType: 'google_search',
      metric: 'ctr',
      condition: 'below',
      threshold: 0.02,
      lookbackDays: 5,
      actionType: 'adjust_bid',
      actionParams: { adjustPercent: -15 },
      status: 'active',
    },
    {
      tenantId: 1,
      campaignId: 1,
      name: 'Budget Pacing Alert',
      description: 'Naikkan budget 20% jika clicks di bawah daily target pace',
      channelType: 'google_search',
      metric: 'clicks',
      condition: 'below',
      threshold: 1800, // 30K / 15 days ~= 2K/day, with some buffer
      lookbackDays: 1,
      actionType: 'adjust_budget',
      actionParams: { adjustPercent: 20 },
      status: 'active',
    },
  ];

  for (const rule of defaults) {
    rules.push({
      ...rule,
      id: nextRuleId++,
      createdAt: new Date().toISOString(),
      lastEvaluatedAt: null,
      lastTriggeredAt: null,
    });
  }
}

// Initialize
initDefaultRules();

// === Rules CRUD ===

export function getRules(campaignId?: number): OptimizeRule[] {
  if (campaignId) return rules.filter(r => r.campaignId === campaignId);
  return rules;
}

export function getRule(id: number): OptimizeRule | undefined {
  return rules.find(r => r.id === id);
}

export function createRule(rule: Omit<OptimizeRule, 'id' | 'createdAt' | 'lastEvaluatedAt' | 'lastTriggeredAt'>): OptimizeRule {
  const newRule: OptimizeRule = {
    ...rule,
    id: nextRuleId++,
    createdAt: new Date().toISOString(),
    lastEvaluatedAt: null,
    lastTriggeredAt: null,
  };
  rules.push(newRule);
  return newRule;
}

export function updateRule(id: number, updates: Partial<OptimizeRule>): OptimizeRule | null {
  const idx = rules.findIndex(r => r.id === id);
  if (idx === -1) return null;
  rules[idx] = { ...rules[idx], ...updates };
  return rules[idx];
}

export function deleteRule(id: number): boolean {
  const idx = rules.findIndex(r => r.id === id);
  if (idx === -1) return false;
  rules.splice(idx, 1);
  return true;
}

// === Action Logs ===

export function getActionLogs(campaignId?: number, limit = 50): ActionLog[] {
  let logs = [...actionLogs].sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
  if (campaignId) logs = logs.filter(l => l.campaignId === campaignId);
  return logs.slice(0, limit);
}

function logAction(action: Omit<ActionLog, 'id'>): ActionLog {
  const log: ActionLog = { ...action, id: nextLogId++ };
  actionLogs.push(log);
  return log;
}

// === Execute Actions ===

export async function executeAction(
  campaignId: number,
  actionType: string,
  target: string,
  params: Record<string, unknown>,
  executedBy: 'ai' | 'rule' | 'manual',
  userId: number | null = null,
  ruleId: number | null = null
): Promise<ActionLog> {
  // In mock mode: just log the action (no real API calls)
  // In live mode: would call Google Ads API here

  const previousValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};

  if (actionType === 'adjust_bid') {
    const provider = getSearchAdsProvider();
    const keywords = await provider.getKeywords(campaignId);
    const keyword = keywords.find(k => k.keyword === target || k.id === Number(target));
    if (keyword) {
      previousValue.cpc = keyword.avgCpc;
      const adjustPct = (params.adjustPercent as number) || 0;
      const newBid = (params.newBid as number) || Math.round(keyword.avgCpc * (1 + adjustPct / 100));
      newValue.cpc = newBid;
    }
  } else if (actionType === 'pause_keyword') {
    previousValue.status = 'active';
    newValue.status = 'paused';
  } else if (actionType === 'enable_keyword') {
    previousValue.status = 'paused';
    newValue.status = 'active';
  } else if (actionType === 'adjust_budget') {
    previousValue.dailyBudget = params.currentBudget || 3_000_000;
    const adjustPct = (params.adjustPercent as number) || 0;
    newValue.dailyBudget = Math.round((previousValue.dailyBudget as number) * (1 + adjustPct / 100));
  }

  const reason = (params.reason as string) || `${actionType} on ${target}`;

  return logAction({
    tenantId: 1,
    ruleId,
    campaignId,
    actionType: actionType as ActionLog['actionType'],
    targetEntity: target,
    previousValue,
    newValue,
    reason,
    status: 'executed',
    executedAt: new Date().toISOString(),
    executedBy,
    userId,
  });
}

// === Evaluate Rules ===

export async function evaluateRules(campaignId: number): Promise<ActionLog[]> {
  const campaignRules = rules.filter(r => r.campaignId === campaignId && r.status === 'active');
  const triggered: ActionLog[] = [];

  const provider = getSearchAdsProvider();
  const keywords = await provider.getKeywords(campaignId);

  for (const rule of campaignRules) {
    rule.lastEvaluatedAt = new Date().toISOString();

    if (rule.metric === 'quality_score') {
      for (const kw of keywords) {
        const value = kw.qualityScore || 0;
        if (rule.condition === 'below' && value < rule.threshold) {
          const action = await executeAction(
            campaignId,
            rule.actionType,
            kw.keyword,
            { ...rule.actionParams, reason: `Rule "${rule.name}": QS ${value} < ${rule.threshold}` },
            'rule',
            null,
            rule.id
          );
          triggered.push(action);
          rule.lastTriggeredAt = new Date().toISOString();
        }
      }
    } else if (rule.metric === 'cpc') {
      for (const kw of keywords) {
        const value = kw.avgCpc;
        if (rule.condition === 'above' && value > rule.threshold) {
          const action = await executeAction(
            campaignId,
            rule.actionType,
            kw.keyword,
            { ...rule.actionParams, reason: `Rule "${rule.name}": CPC Rp${value} > Rp${rule.threshold}` },
            'rule',
            null,
            rule.id
          );
          triggered.push(action);
          rule.lastTriggeredAt = new Date().toISOString();
        }
      }
    } else if (rule.metric === 'ctr') {
      for (const kw of keywords) {
        // Mock CTR check — in production would use actual metrics
        const mockCtr = 0.03 + Math.random() * 0.04; // 3-7% mock
        if (rule.condition === 'below' && mockCtr < rule.threshold) {
          const action = await executeAction(
            campaignId,
            rule.actionType,
            kw.keyword,
            { ...rule.actionParams, reason: `Rule "${rule.name}": CTR ${(mockCtr * 100).toFixed(1)}% < ${(rule.threshold * 100).toFixed(1)}%` },
            'rule',
            null,
            rule.id
          );
          triggered.push(action);
          rule.lastTriggeredAt = new Date().toISOString();
        }
      }
    }
  }

  return triggered;
}

// === Suggestions ===

export function getSuggestions(campaignId?: number): OptimizeSuggestion[] {
  if (campaignId) return suggestions.filter(s => s.campaignId === campaignId);
  return suggestions;
}

export function generateSuggestions(campaignId: number, aiInsights: Array<{ actions?: Array<{ actionType: string; target: string; suggestion: string; expectedImpact: string }> }>): OptimizeSuggestion[] {
  // Convert AI insights actions into suggestions
  const newSuggestions: OptimizeSuggestion[] = [];

  for (const insight of aiInsights) {
    if (!insight.actions) continue;
    for (const action of insight.actions) {
      const suggestion: OptimizeSuggestion = {
        id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        campaignId,
        actionType: action.actionType as OptimizeSuggestion['actionType'],
        targetEntity: action.target,
        currentValue: {},
        suggestedValue: {},
        reason: action.suggestion,
        expectedImpact: action.expectedImpact,
        confidence: 0.7 + Math.random() * 0.25,
        priority: 'medium',
        source: 'ai',
        createdAt: new Date().toISOString(),
      };
      newSuggestions.push(suggestion);
      suggestions.push(suggestion);
    }
  }

  return newSuggestions;
}
