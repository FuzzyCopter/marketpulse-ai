import type { AlertRule, AlertEvent } from '@marketpulse/shared';
import { getSearchAdsProvider, getDiscoveryAdsProvider, getSocialMediaProvider } from '../datasources/index.js';
import { HONDA_CAMPAIGNS } from '@marketpulse/shared';

// In-memory storage
const alertRules: AlertRule[] = [];
const alertEvents: AlertEvent[] = [];
let nextRuleId = 1;
let nextEventId = 1;

// === Default alert rules for Honda MBBH ===
function initDefaults(): void {
  if (alertRules.length > 0) return;

  const defaults: Array<Omit<AlertRule, 'id' | 'createdAt'>> = [
    {
      tenantId: 1,
      campaignId: 1,
      name: 'SEM Daily Clicks Drop',
      metricName: 'clicks',
      condition: 'below',
      threshold: 1500,
      channelType: 'google_search',
      notification: { inApp: true, email: true },
      isActive: true,
    },
    {
      tenantId: 1,
      campaignId: 1,
      name: 'CPC Spike Alert',
      metricName: 'cpc',
      condition: 'above',
      threshold: 2500,
      channelType: 'google_search',
      notification: { inApp: true },
      isActive: true,
    },
    {
      tenantId: 1,
      campaignId: 1,
      name: 'Discovery Visits Below Target',
      metricName: 'visits',
      condition: 'below',
      threshold: 2500,
      channelType: 'google_discovery',
      notification: { inApp: true, email: true },
      isActive: true,
    },
    {
      tenantId: 1,
      campaignId: 1,
      name: 'CTR Too Low',
      metricName: 'ctr',
      condition: 'below',
      threshold: 0.03,
      channelType: null,
      notification: { inApp: true },
      isActive: true,
    },
    {
      tenantId: 1,
      campaignId: 1,
      name: 'Budget Overspend',
      metricName: 'cost',
      condition: 'above',
      threshold: 5_000_000,
      channelType: 'google_search',
      notification: { inApp: true, email: true },
      isActive: true,
    },
  ];

  for (const rule of defaults) {
    alertRules.push({ ...rule, id: nextRuleId++, createdAt: new Date().toISOString() });
  }

  // Generate some mock triggered events
  generateMockEvents();
}

function generateMockEvents(): void {
  const now = new Date();
  const mockEvents: Array<Omit<AlertEvent, 'id'>> = [
    {
      tenantId: 1,
      ruleId: 1,
      campaignId: 1,
      triggeredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      metricValue: 1_230,
      thresholdValue: 1_500,
      message: 'SEM daily clicks (1,230) dropped below threshold (1,500). Campaign MBBH mungkin perlu budget boost.',
      isAcknowledged: false,
      acknowledgedBy: null,
    },
    {
      tenantId: 1,
      ruleId: 2,
      campaignId: 1,
      triggeredAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      metricValue: 2_800,
      thresholdValue: 2_500,
      message: 'CPC spike detected: Rp 2,800 (threshold Rp 2,500). Keyword "mudik motor gratis 2026" mungkin terlalu kompetitif.',
      isAcknowledged: true,
      acknowledgedBy: 1,
    },
    {
      tenantId: 1,
      ruleId: 3,
      campaignId: 1,
      triggeredAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      metricValue: 2_100,
      thresholdValue: 2_500,
      message: 'Discovery visits (2,100) below daily target (2,500). Perlu review creative performance.',
      isAcknowledged: false,
      acknowledgedBy: null,
    },
    {
      tenantId: 1,
      ruleId: 4,
      campaignId: 1,
      triggeredAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      metricValue: 0.025,
      thresholdValue: 0.03,
      message: 'CTR turun ke 2.5%, di bawah threshold 3%. Review ad copy dan keyword relevance.',
      isAcknowledged: true,
      acknowledgedBy: 1,
    },
    {
      tenantId: 1,
      ruleId: 5,
      campaignId: 1,
      triggeredAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      metricValue: 5_500_000,
      thresholdValue: 5_000_000,
      message: 'Daily spend Rp 5,500,000 melebihi budget Rp 5,000,000. Pertimbangkan turunkan bid broad match keywords.',
      isAcknowledged: false,
      acknowledgedBy: null,
    },
  ];

  for (const evt of mockEvents) {
    alertEvents.push({ ...evt, id: nextEventId++ });
  }
}

initDefaults();

// === Rules CRUD ===

export function getAlertRules(campaignId?: number): AlertRule[] {
  if (campaignId) return alertRules.filter(r => r.campaignId === campaignId);
  return alertRules;
}

export function getAlertRule(id: number): AlertRule | undefined {
  return alertRules.find(r => r.id === id);
}

export function createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): AlertRule {
  const newRule: AlertRule = { ...rule, id: nextRuleId++, createdAt: new Date().toISOString() };
  alertRules.push(newRule);
  return newRule;
}

export function updateAlertRule(id: number, updates: Partial<AlertRule>): AlertRule | null {
  const idx = alertRules.findIndex(r => r.id === id);
  if (idx === -1) return null;
  alertRules[idx] = { ...alertRules[idx], ...updates };
  return alertRules[idx];
}

export function deleteAlertRule(id: number): boolean {
  const idx = alertRules.findIndex(r => r.id === id);
  if (idx === -1) return false;
  alertRules.splice(idx, 1);
  return true;
}

// === Events ===

export function getAlertEvents(campaignId?: number, acknowledged?: boolean): AlertEvent[] {
  let events = [...alertEvents].sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  if (campaignId) events = events.filter(e => e.campaignId === campaignId);
  if (acknowledged !== undefined) events = events.filter(e => e.isAcknowledged === acknowledged);
  return events;
}

export function acknowledgeEvent(id: number, userId: number): AlertEvent | null {
  const evt = alertEvents.find(e => e.id === id);
  if (!evt) return null;
  evt.isAcknowledged = true;
  evt.acknowledgedBy = userId;
  return evt;
}

export function acknowledgeAll(campaignId: number, userId: number): number {
  let count = 0;
  for (const evt of alertEvents) {
    if (evt.campaignId === campaignId && !evt.isAcknowledged) {
      evt.isAcknowledged = true;
      evt.acknowledgedBy = userId;
      count++;
    }
  }
  return count;
}

// === Evaluate (check metrics against rules) ===

export async function evaluateAlertRules(campaignId: number): Promise<AlertEvent[]> {
  const activeRules = alertRules.filter(r => r.campaignId === campaignId && r.isActive);
  const triggered: AlertEvent[] = [];
  const campaign = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;

  for (const rule of activeRules) {
    // Generate mock metric values for evaluation
    let metricValue = 0;
    const dailyTarget = rule.channelType === 'google_search'
      ? campaign.channels[0].targetValue / campaign.totalDays
      : campaign.channels[1]?.targetValue / campaign.totalDays || 0;

    if (rule.metricName === 'clicks') metricValue = Math.round(dailyTarget * (0.7 + Math.random() * 0.6));
    else if (rule.metricName === 'visits') metricValue = Math.round(dailyTarget * (0.7 + Math.random() * 0.6));
    else if (rule.metricName === 'cpc') metricValue = Math.round(1000 + Math.random() * 2000);
    else if (rule.metricName === 'ctr') metricValue = 0.02 + Math.random() * 0.04;
    else if (rule.metricName === 'cost') metricValue = Math.round(3_000_000 + Math.random() * 3_000_000);

    let shouldTrigger = false;
    if (rule.condition === 'above' && metricValue > rule.threshold) shouldTrigger = true;
    if (rule.condition === 'below' && metricValue < rule.threshold) shouldTrigger = true;

    if (shouldTrigger) {
      const formatValue = rule.metricName === 'ctr'
        ? `${(metricValue * 100).toFixed(1)}%`
        : rule.metricName === 'cost' || rule.metricName === 'cpc'
          ? `Rp ${metricValue.toLocaleString()}`
          : metricValue.toLocaleString();

      const formatThreshold = rule.metricName === 'ctr'
        ? `${(rule.threshold * 100).toFixed(1)}%`
        : rule.metricName === 'cost' || rule.metricName === 'cpc'
          ? `Rp ${rule.threshold.toLocaleString()}`
          : rule.threshold.toLocaleString();

      const event: AlertEvent = {
        id: nextEventId++,
        tenantId: 1,
        ruleId: rule.id,
        campaignId,
        triggeredAt: new Date().toISOString(),
        metricValue,
        thresholdValue: rule.threshold,
        message: `${rule.name}: ${rule.metricName} ${formatValue} ${rule.condition === 'above' ? '>' : '<'} threshold ${formatThreshold}`,
        isAcknowledged: false,
        acknowledgedBy: null,
      };
      alertEvents.push(event);
      triggered.push(event);
    }
  }

  return triggered;
}

export function getAlertStats(campaignId: number): { total: number; unacknowledged: number; critical: number } {
  const events = alertEvents.filter(e => e.campaignId === campaignId);
  return {
    total: events.length,
    unacknowledged: events.filter(e => !e.isAcknowledged).length,
    critical: events.filter(e => !e.isAcknowledged && e.metricValue > e.thresholdValue * 1.2).length,
  };
}
