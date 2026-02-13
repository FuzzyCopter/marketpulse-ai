import type { MetricsQuery, MetricsResult } from '@marketpulse/shared';
import { HONDA_CAMPAIGNS } from '@marketpulse/shared';
import type { IDiscoveryAdsProvider, CreativeData, AudienceData } from '../interfaces.js';
import { generateTimeSeriesUpToToday } from './generators/time-series.js';

export class MockDiscoveryAdsProvider implements IDiscoveryAdsProvider {
  async getMetrics(query: MetricsQuery): Promise<MetricsResult> {
    const campaign = query.campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;
    const channelDef = campaign.channels.find(c => c.channelType === 'google_discovery');
    if (!channelDef) {
      return { data: [], totals: this.emptyTotals(), meta: { source: 'mock', fetchedAt: new Date().toISOString() } };
    }

    const data = generateTimeSeriesUpToToday({
      startDate: query.startDate || campaign.startDate,
      endDate: query.endDate || campaign.endDate,
      targetTotal: channelDef.targetValue,
      avgCTR: channelDef.estimatedCTR,
      avgCPC: channelDef.estimatedCPC,
      conversionRate: 0.015,
    }, query.campaignId * 100 + 2);

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
        channelId: 2,
        channelType: 'google_discovery' as const,
        metricDate: d.date,
        ...d,
        qualityScore: null,
        extraMetrics: {},
      })),
      totals,
      meta: { source: 'mock', fetchedAt: new Date().toISOString() },
    };
  }

  async getCreativePerformance(_campaignId: number): Promise<CreativeData[]> {
    return [
      { id: 1, headline: 'Mudik Gratis Bareng Honda 2026!', description: 'Daftar sekarang, mudik aman & nyaman bersama Honda.', imageUrl: null, impressions: 850_000, clicks: 18_500, ctr: 0.0218 },
      { id: 2, headline: 'Ribuan Motor Honda Antarkan Pemudik', description: 'Program mudik terbesar Honda. Kuota terbatas!', imageUrl: null, impressions: 720_000, clicks: 15_200, ctr: 0.0211 },
      { id: 3, headline: 'Pulang Kampung Bersama Honda', description: 'Safety first, Honda kirim motor kamu gratis.', imageUrl: null, impressions: 550_000, clicks: 9_800, ctr: 0.0178 },
      { id: 4, headline: 'Honda MBBH 2026: Daftar & Mudik!', description: 'Jangan lewatkan kesempatan mudik gratis dari Honda.', imageUrl: null, impressions: 380_000, clicks: 6_500, ctr: 0.0171 },
    ];
  }

  async getAudienceBreakdown(_campaignId: number): Promise<AudienceData[]> {
    return [
      { segment: 'Male 25-34', impressions: 820_000, clicks: 18_000, ctr: 0.022, conversions: 420 },
      { segment: 'Male 35-50', impressions: 650_000, clicks: 12_500, ctr: 0.019, conversions: 310 },
      { segment: 'Female 25-34', impressions: 580_000, clicks: 11_200, ctr: 0.019, conversions: 280 },
      { segment: 'Female 35-50', impressions: 450_000, clicks: 8_300, ctr: 0.018, conversions: 190 },
    ];
  }

  private emptyTotals() {
    return { impressions: 0, clicks: 0, visits: 0, conversions: 0, cost: 0, avgCtr: 0, avgCpc: 0, avgConversionRate: 0 };
  }
}
