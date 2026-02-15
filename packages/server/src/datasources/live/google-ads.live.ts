import { getGoogleAuth } from './google-auth.js';
import { env } from '../../config/env.js';
import type { MetricsQuery, MetricsResult, SEMKeyword, SEMKeywordMetric } from '@marketpulse/shared';
import type {
  ISearchAdsProvider,
  IDiscoveryAdsProvider,
  BidSuggestion,
  AdGroupData,
  SearchTermData,
  CreativeData,
  AudienceData,
} from '../interfaces.js';
import { MockSearchAdsProvider } from '../mock/google-search.mock.js';
import { MockDiscoveryAdsProvider } from '../mock/google-discovery.mock.js';

const ADS_API_VERSION = 'v17';
const ADS_BASE_URL = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

const searchMockFallback = new MockSearchAdsProvider();
const discoveryMockFallback = new MockDiscoveryAdsProvider();

async function queryGoogleAds(gaql: string): Promise<any[]> {
  const auth = getGoogleAuth();
  const { token } = await auth.getAccessToken();
  const customerId = env.google.adsCustomerId;

  const res = await fetch(
    `${ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'developer-token': env.google.adsDeveloperToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: gaql }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Ads API error ${res.status}: ${errorBody}`);
  }

  const json = await res.json() as any[];
  // searchStream returns array of batches, each with results array
  const allResults: any[] = [];
  for (const batch of json) {
    if (batch.results) allResults.push(...batch.results);
  }
  return allResults;
}

function microsToCurrency(micros: string | number): number {
  return Math.round(Number(micros) / 1_000_000);
}

// ── Live Search Ads Provider ─────────────────────────────────────

export class LiveSearchAdsProvider implements ISearchAdsProvider {
  async getMetrics(query: MetricsQuery): Promise<MetricsResult> {
    try {
      const gaql = `
        SELECT
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
        WHERE campaign.advertising_channel_type = 'SEARCH'
          AND segments.date BETWEEN '${query.startDate}' AND '${query.endDate}'
        ORDER BY segments.date ASC
      `;

      const results = await queryGoogleAds(gaql);
      if (results.length === 0) {
        console.log('[LiveSearchAds] No data from Google Ads, falling back to mock');
        return searchMockFallback.getMetrics(query);
      }

      const data = results.map((row, i) => ({
        id: i + 1,
        tenantId: 1,
        campaignId: query.campaignId,
        channelId: 1,
        channelType: 'google_search' as const,
        metricDate: row.segments.date,
        impressions: Number(row.metrics.impressions || 0),
        clicks: Number(row.metrics.clicks || 0),
        visits: Number(row.metrics.clicks || 0),
        conversions: Number(row.metrics.conversions || 0),
        cost: microsToCurrency(row.metrics.costMicros || 0),
        ctr: Number(row.metrics.ctr || 0),
        cpc: microsToCurrency(row.metrics.averageCpc || 0),
        conversionRate: Number(row.metrics.clicks) > 0
          ? Number(row.metrics.conversions) / Number(row.metrics.clicks)
          : 0,
        qualityScore: null,
        extraMetrics: {},
      }));

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

      return { data, totals, meta: { source: 'live', fetchedAt: new Date().toISOString() } };
    } catch (err: any) {
      console.error('[LiveSearchAds] getMetrics error:', err.message);
      return searchMockFallback.getMetrics(query);
    }
  }

  async getKeywords(campaignId: number): Promise<SEMKeyword[]> {
    try {
      const gaql = `
        SELECT
          ad_group_criterion.criterion_id,
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.status,
          ad_group_criterion.effective_cpc_bid_micros,
          ad_group_criterion.quality_info.quality_score,
          ad_group.name
        FROM keyword_view
        WHERE campaign.advertising_channel_type = 'SEARCH'
          AND ad_group_criterion.status != 'REMOVED'
        LIMIT 100
      `;

      const results = await queryGoogleAds(gaql);
      if (results.length === 0) return searchMockFallback.getKeywords(campaignId);

      return results.map((row, i) => ({
        id: i + 1,
        tenantId: 1,
        campaignId,
        channelId: 1,
        keyword: row.adGroupCriterion.keyword.text,
        matchType: (row.adGroupCriterion.keyword.matchType || 'BROAD').toLowerCase() as any,
        status: (row.adGroupCriterion.status || 'ENABLED').toLowerCase() === 'enabled' ? 'active' as const : 'paused' as const,
        maxCpc: microsToCurrency(row.adGroupCriterion.effectiveCpcBidMicros || 0),
        qualityScore: row.adGroupCriterion.qualityInfo?.qualityScore || null,
        adGroup: row.adGroup?.name || 'Default',
      }));
    } catch (err: any) {
      console.error('[LiveSearchAds] getKeywords error:', err.message);
      return searchMockFallback.getKeywords(campaignId);
    }
  }

  async getKeywordMetrics(keywordId: number, startDate: string, endDate: string): Promise<SEMKeywordMetric[]> {
    // Keyword-level daily metrics requires criterion_id which we'd need to track
    // Fall back to mock for now
    return searchMockFallback.getKeywordMetrics(keywordId, startDate, endDate);
  }

  async getAdGroups(campaignId: number): Promise<AdGroupData[]> {
    try {
      const gaql = `
        SELECT
          ad_group.name,
          ad_group.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc,
          metrics.conversions
        FROM ad_group
        WHERE campaign.advertising_channel_type = 'SEARCH'
          AND ad_group.status != 'REMOVED'
      `;

      const results = await queryGoogleAds(gaql);
      if (results.length === 0) return searchMockFallback.getAdGroups(campaignId);

      return results.map(row => ({
        name: row.adGroup.name,
        status: (row.adGroup.status || 'ENABLED').toLowerCase(),
        keywords: 0, // Would need separate query
        impressions: Number(row.metrics.impressions || 0),
        clicks: Number(row.metrics.clicks || 0),
        cost: microsToCurrency(row.metrics.costMicros || 0),
        ctr: Number(row.metrics.ctr || 0),
        avgCpc: microsToCurrency(row.metrics.averageCpc || 0),
        conversions: Number(row.metrics.conversions || 0),
      }));
    } catch (err: any) {
      console.error('[LiveSearchAds] getAdGroups error:', err.message);
      return searchMockFallback.getAdGroups(campaignId);
    }
  }

  async getSearchTerms(campaignId: number, startDate: string, endDate: string): Promise<SearchTermData[]> {
    try {
      const gaql = `
        SELECT
          search_term_view.search_term,
          segments.keyword.info.text,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros
        FROM search_term_view
        WHERE campaign.advertising_channel_type = 'SEARCH'
          AND segments.date BETWEEN '${startDate}' AND '${endDate}'
        ORDER BY metrics.impressions DESC
        LIMIT 50
      `;

      const results = await queryGoogleAds(gaql);
      if (results.length === 0) return searchMockFallback.getSearchTerms(campaignId, startDate, endDate);

      return results.map(row => ({
        searchTerm: row.searchTermView.searchTerm,
        matchedKeyword: row.segments?.keyword?.info?.text || '',
        impressions: Number(row.metrics.impressions || 0),
        clicks: Number(row.metrics.clicks || 0),
        ctr: Number(row.metrics.ctr || 0),
        cost: microsToCurrency(row.metrics.costMicros || 0),
      }));
    } catch (err: any) {
      console.error('[LiveSearchAds] getSearchTerms error:', err.message);
      return searchMockFallback.getSearchTerms(campaignId, startDate, endDate);
    }
  }

  async getBidSuggestions(campaignId: number): Promise<BidSuggestion[]> {
    // Bid suggestions are computed, not available directly from API
    return searchMockFallback.getBidSuggestions(campaignId);
  }
}

// ── Live Discovery Ads Provider ──────────────────────────────────

export class LiveDiscoveryAdsProvider implements IDiscoveryAdsProvider {
  async getMetrics(query: MetricsQuery): Promise<MetricsResult> {
    try {
      const gaql = `
        SELECT
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
        WHERE campaign.advertising_channel_type = 'DISCOVERY'
          AND segments.date BETWEEN '${query.startDate}' AND '${query.endDate}'
        ORDER BY segments.date ASC
      `;

      const results = await queryGoogleAds(gaql);
      if (results.length === 0) {
        console.log('[LiveDiscovery] No data from Google Ads, falling back to mock');
        return discoveryMockFallback.getMetrics(query);
      }

      const data = results.map((row, i) => ({
        id: i + 1,
        tenantId: 1,
        campaignId: query.campaignId,
        channelId: 2,
        channelType: 'google_discovery' as const,
        metricDate: row.segments.date,
        impressions: Number(row.metrics.impressions || 0),
        clicks: Number(row.metrics.clicks || 0),
        visits: Number(row.metrics.clicks || 0),
        conversions: Number(row.metrics.conversions || 0),
        cost: microsToCurrency(row.metrics.costMicros || 0),
        ctr: Number(row.metrics.ctr || 0),
        cpc: microsToCurrency(row.metrics.averageCpc || 0),
        conversionRate: Number(row.metrics.clicks) > 0
          ? Number(row.metrics.conversions) / Number(row.metrics.clicks)
          : 0,
        qualityScore: null,
        extraMetrics: {},
      }));

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

      return { data, totals, meta: { source: 'live', fetchedAt: new Date().toISOString() } };
    } catch (err: any) {
      console.error('[LiveDiscovery] getMetrics error:', err.message);
      return discoveryMockFallback.getMetrics(query);
    }
  }

  async getCreativePerformance(campaignId: number): Promise<CreativeData[]> {
    try {
      const gaql = `
        SELECT
          ad_group_ad.ad.id,
          ad_group_ad.ad.responsive_display_ad.long_headline.text,
          ad_group_ad.ad.responsive_display_ad.descriptions,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr
        FROM ad_group_ad
        WHERE campaign.advertising_channel_type = 'DISCOVERY'
          AND ad_group_ad.status != 'REMOVED'
        ORDER BY metrics.impressions DESC
        LIMIT 10
      `;

      const results = await queryGoogleAds(gaql);
      if (results.length === 0) return discoveryMockFallback.getCreativePerformance(campaignId);

      return results.map((row, i) => ({
        id: i + 1,
        headline: row.adGroupAd?.ad?.responsiveDisplayAd?.longHeadline?.text || `Ad ${i + 1}`,
        description: row.adGroupAd?.ad?.responsiveDisplayAd?.descriptions?.[0]?.text || '',
        imageUrl: null,
        impressions: Number(row.metrics.impressions || 0),
        clicks: Number(row.metrics.clicks || 0),
        ctr: Number(row.metrics.ctr || 0),
      }));
    } catch (err: any) {
      console.error('[LiveDiscovery] getCreativePerformance error:', err.message);
      return discoveryMockFallback.getCreativePerformance(campaignId);
    }
  }

  async getAudienceBreakdown(campaignId: number): Promise<AudienceData[]> {
    try {
      const gaql = `
        SELECT
          ad_group_criterion.age_range.type,
          ad_group_criterion.gender.type,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.conversions
        FROM gender_view
        WHERE campaign.advertising_channel_type = 'DISCOVERY'
        ORDER BY metrics.impressions DESC
      `;

      const results = await queryGoogleAds(gaql);
      if (results.length === 0) return discoveryMockFallback.getAudienceBreakdown(campaignId);

      return results.map(row => ({
        segment: row.adGroupCriterion?.gender?.type || 'Unknown',
        impressions: Number(row.metrics.impressions || 0),
        clicks: Number(row.metrics.clicks || 0),
        ctr: Number(row.metrics.ctr || 0),
        conversions: Number(row.metrics.conversions || 0),
      }));
    } catch (err: any) {
      console.error('[LiveDiscovery] getAudienceBreakdown error:', err.message);
      return discoveryMockFallback.getAudienceBreakdown(campaignId);
    }
  }
}
