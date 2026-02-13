import type { MetricsQuery, MetricsResult } from '@marketpulse/shared';
import { HONDA_CAMPAIGNS } from '@marketpulse/shared';
import type { ISocialMediaProvider, PlatformBreakdown } from '../interfaces.js';
import { generateTimeSeriesUpToToday } from './generators/time-series.js';

export class MockSocialMediaProvider implements ISocialMediaProvider {
  async getMetrics(query: MetricsQuery): Promise<MetricsResult> {
    const campaign = query.campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;
    const socialTotal = campaign.socialBreakdown.reduce((sum, s) => sum + s.targetClicks, 0);

    const data = generateTimeSeriesUpToToday({
      startDate: query.startDate || campaign.startDate,
      endDate: query.endDate || campaign.endDate,
      targetTotal: socialTotal,
      avgCTR: 0.02,
      avgCPC: 3_000,
      conversionRate: 0.01,
    }, query.campaignId * 100 + 3);

    const totals = {
      impressions: data.reduce((s, d) => s + d.impressions, 0),
      clicks: data.reduce((s, d) => s + d.clicks, 0),
      visits: data.reduce((s, d) => s + d.visits, 0),
      conversions: data.reduce((s, d) => s + d.conversions, 0),
      cost: data.reduce((s, d) => s + d.cost, 0),
      avgCtr: 0,
      avgCpc: 0,
      avgConversionRate: 0,
    };
    totals.avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
    totals.avgCpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    totals.avgConversionRate = totals.clicks > 0 ? totals.conversions / totals.clicks : 0;

    return {
      data: data.map((d, i) => ({
        id: i + 1,
        tenantId: 1,
        campaignId: query.campaignId,
        channelId: 3,
        channelType: (query.channelType || 'social_tiktok') as 'social_tiktok',
        metricDate: d.date,
        ...d,
        qualityScore: null,
        extraMetrics: {},
      })),
      totals,
      meta: { source: 'mock', fetchedAt: new Date().toISOString() },
    };
  }

  async getPlatformBreakdown(campaignId: number, _startDate: string, _endDate: string): Promise<PlatformBreakdown> {
    const campaign = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;

    return {
      tiktok: {
        clicks: campaign.socialBreakdown[0].targetClicks,
        impressions: Math.round(campaign.socialBreakdown[0].targetClicks / 0.025),
        cost: campaign.socialBreakdown[0].targetClicks * 2_500,
        ctr: 0.025,
      },
      instagram: {
        clicks: campaign.socialBreakdown[1].targetClicks,
        impressions: Math.round(campaign.socialBreakdown[1].targetClicks / 0.018),
        cost: campaign.socialBreakdown[1].targetClicks * 3_200,
        ctr: 0.018,
      },
      facebook: {
        clicks: campaign.socialBreakdown[2].targetClicks,
        impressions: Math.round(campaign.socialBreakdown[2].targetClicks / 0.015),
        cost: campaign.socialBreakdown[2].targetClicks * 3_500,
        ctr: 0.015,
      },
    };
  }
}
