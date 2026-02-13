import type { MetricsQuery, MetricsResult, SEMKeyword, SEMKeywordMetric } from '@marketpulse/shared';
import { HONDA_CAMPAIGNS, MBBH_SEM_KEYWORDS } from '@marketpulse/shared';
import type { ISearchAdsProvider, BidSuggestion, AdGroupData, SearchTermData } from '../interfaces.js';
import { generateTimeSeriesUpToToday } from './generators/time-series.js';

export class MockSearchAdsProvider implements ISearchAdsProvider {
  async getMetrics(query: MetricsQuery): Promise<MetricsResult> {
    const campaign = query.campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;
    const channelDef = campaign.channels.find(c => c.channelType === 'google_search');
    if (!channelDef) {
      return { data: [], totals: this.emptyTotals(), meta: { source: 'mock', fetchedAt: new Date().toISOString() } };
    }

    const data = generateTimeSeriesUpToToday({
      startDate: query.startDate || campaign.startDate,
      endDate: query.endDate || campaign.endDate,
      targetTotal: channelDef.targetValue,
      avgCTR: channelDef.estimatedCTR,
      avgCPC: channelDef.estimatedCPC,
    }, query.campaignId * 100 + 1);

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
        channelId: 1,
        channelType: 'google_search' as const,
        metricDate: d.date,
        ...d,
        qualityScore: null,
        extraMetrics: {},
      })),
      totals,
      meta: { source: 'mock', fetchedAt: new Date().toISOString() },
    };
  }

  async getKeywords(campaignId: number): Promise<SEMKeyword[]> {
    return MBBH_SEM_KEYWORDS.map((kw, i) => ({
      id: i + 1,
      tenantId: 1,
      campaignId,
      channelId: 1,
      keyword: kw.keyword,
      matchType: kw.matchType,
      status: 'active' as const,
      maxCpc: kw.avgCpc * 1.5,
      qualityScore: kw.qualityScore,
      adGroup: kw.adGroup,
    }));
  }

  async getKeywordMetrics(keywordId: number, startDate: string, endDate: string): Promise<SEMKeywordMetric[]> {
    const kw = MBBH_SEM_KEYWORDS[keywordId - 1] || MBBH_SEM_KEYWORDS[0];
    const data = generateTimeSeriesUpToToday({
      startDate,
      endDate,
      targetTotal: Math.round(30000 / MBBH_SEM_KEYWORDS.length),
      avgCTR: 0.05,
      avgCPC: kw.avgCpc,
    }, keywordId * 1000);

    return data.map((d, i) => ({
      id: i + 1,
      keywordId,
      metricDate: d.date,
      impressions: d.impressions,
      clicks: d.clicks,
      cost: d.cost,
      ctr: d.ctr,
      avgCpc: d.cpc,
      avgPosition: parseFloat((1.5 + Math.random() * 3).toFixed(1)),
      conversions: d.conversions,
      qualityScore: kw.qualityScore,
    }));
  }

  async getAdGroups(campaignId: number): Promise<AdGroupData[]> {
    const groups = [...new Set(MBBH_SEM_KEYWORDS.map(k => k.adGroup))];
    return groups.map(name => {
      const kwCount = MBBH_SEM_KEYWORDS.filter(k => k.adGroup === name).length;
      const baseClicks = Math.round((30000 / MBBH_SEM_KEYWORDS.length) * kwCount);
      return {
        name,
        status: 'active',
        keywords: kwCount,
        impressions: Math.round(baseClicks / 0.05),
        clicks: baseClicks,
        cost: baseClicks * 1200,
        ctr: 0.05,
        avgCpc: 1200,
        conversions: Math.round(baseClicks * 0.025),
      };
    });
  }

  async getSearchTerms(_campaignId: number, _startDate: string, _endDate: string): Promise<SearchTermData[]> {
    const terms = [
      'mudik bareng honda 2026 jakarta', 'daftar mudik honda gratis', 'cara ikut mudik honda',
      'mudik motor honda lebaran', 'honda mudik 2026 surabaya', 'program mudik honda murah',
      'mudik bareng honda bandung', 'syarat mudik honda', 'jadwal mudik honda 2026 solo',
      'tips mudik motor honda aman',
    ];
    return terms.map(term => ({
      searchTerm: term,
      matchedKeyword: MBBH_SEM_KEYWORDS[Math.floor(Math.random() * MBBH_SEM_KEYWORDS.length)].keyword,
      impressions: Math.round(500 + Math.random() * 5000),
      clicks: Math.round(25 + Math.random() * 250),
      ctr: parseFloat((0.02 + Math.random() * 0.06).toFixed(4)),
      cost: Math.round(25000 + Math.random() * 250000),
    }));
  }

  async getBidSuggestions(campaignId: number): Promise<BidSuggestion[]> {
    const keywords = await this.getKeywords(campaignId);
    return keywords.slice(0, 5).map(kw => ({
      keywordId: kw.id,
      keyword: kw.keyword,
      currentCpc: kw.maxCpc || 1000,
      suggestedCpc: Math.round((kw.maxCpc || 1000) * (0.85 + Math.random() * 0.3)),
      reason: kw.qualityScore! >= 8
        ? 'High quality score — consider increasing bid to capture more volume'
        : 'Below average CTR — lower bid to improve ROI',
      expectedImpact: kw.qualityScore! >= 8
        ? `+${Math.round(10 + Math.random() * 20)}% impressions`
        : `-${Math.round(5 + Math.random() * 15)}% cost with similar conversions`,
    }));
  }

  private emptyTotals() {
    return { impressions: 0, clicks: 0, visits: 0, conversions: 0, cost: 0, avgCtr: 0, avgCpc: 0, avgConversionRate: 0 };
  }
}
