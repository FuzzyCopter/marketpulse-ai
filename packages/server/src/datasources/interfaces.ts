import type {
  MetricsQuery,
  MetricsResult,
  SEMKeyword,
  SEMKeywordMetric,
  SEORanking,
  SEOPageAudit,
} from '@marketpulse/shared';

export interface BidSuggestion {
  keywordId: number;
  keyword: string;
  currentCpc: number;
  suggestedCpc: number;
  reason: string;
  expectedImpact: string;
}

export interface AdGroupData {
  name: string;
  status: string;
  keywords: number;
  impressions: number;
  clicks: number;
  cost: number;
  ctr: number;
  avgCpc: number;
  conversions: number;
}

export interface SearchTermData {
  searchTerm: string;
  matchedKeyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
}

export interface CreativeData {
  id: number;
  headline: string;
  description: string;
  imageUrl: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AudienceData {
  segment: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
}

export interface PlatformBreakdown {
  tiktok: { clicks: number; impressions: number; cost: number; ctr: number };
  instagram: { clicks: number; impressions: number; cost: number; ctr: number };
  facebook: { clicks: number; impressions: number; cost: number; ctr: number };
}

export interface BacklinkData {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domainAuthority: number;
  isNew: boolean;
  firstSeen: string;
}

export interface TechnicalIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  description: string;
  howToFix: string;
}

// === Provider Interfaces ===

export interface ISearchAdsProvider {
  getMetrics(query: MetricsQuery): Promise<MetricsResult>;
  getKeywords(campaignId: number): Promise<SEMKeyword[]>;
  getKeywordMetrics(keywordId: number, startDate: string, endDate: string): Promise<SEMKeywordMetric[]>;
  getAdGroups(campaignId: number): Promise<AdGroupData[]>;
  getSearchTerms(campaignId: number, startDate: string, endDate: string): Promise<SearchTermData[]>;
  getBidSuggestions(campaignId: number): Promise<BidSuggestion[]>;
}

export interface IDiscoveryAdsProvider {
  getMetrics(query: MetricsQuery): Promise<MetricsResult>;
  getCreativePerformance(campaignId: number): Promise<CreativeData[]>;
  getAudienceBreakdown(campaignId: number): Promise<AudienceData[]>;
}

export interface ISocialMediaProvider {
  getMetrics(query: MetricsQuery): Promise<MetricsResult>;
  getPlatformBreakdown(campaignId: number, startDate: string, endDate: string): Promise<PlatformBreakdown>;
}

export interface ISEOProvider {
  getRankings(campaignId: number, startDate: string, endDate: string): Promise<SEORanking[]>;
  getPageAudits(campaignId: number): Promise<SEOPageAudit[]>;
  getBacklinks(campaignId: number): Promise<BacklinkData[]>;
  getTechnicalIssues(campaignId: number): Promise<TechnicalIssue[]>;
}
