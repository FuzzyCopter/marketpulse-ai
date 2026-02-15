import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth.js';
import { getCampaignConfig } from './campaign-config.js';
import type { SEORanking, SEOPageAudit } from '@marketpulse/shared';
import type { ISEOProvider, BacklinkData, TechnicalIssue } from '../interfaces.js';
import { MockSEOProvider } from '../mock/seo.mock.js';

const mockFallback = new MockSEOProvider();

export class LiveSEOProvider implements ISEOProvider {
  private getSearchConsole() {
    return google.searchconsole({ version: 'v1', auth: getGoogleAuth() });
  }

  async getRankings(campaignId: number, startDate: string, endDate: string): Promise<SEORanking[]> {
    const { siteUrl } = getCampaignConfig(campaignId);
    try {
      const sc = this.getSearchConsole();

      const response = await sc.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query', 'page', 'date'],
          rowLimit: 500,
          type: 'web',
        },
      });

      const rows = response.data.rows || [];
      if (rows.length === 0) {
        console.log(`[LiveSEO] No Search Console data for ${siteUrl}, falling back to mock`);
        return mockFallback.getRankings(campaignId, startDate, endDate);
      }

      return rows.map((row, idx) => ({
        id: idx + 1,
        tenantId: 1,
        campaignId,
        keyword: row.keys?.[0] || '',
        url: row.keys?.[1] || null,
        position: row.position ? Math.round(row.position * 10) / 10 : null,
        previousPosition: null,
        searchVolume: null,
        difficulty: null,
        metricDate: row.keys?.[2] || startDate,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr ? Math.round(row.ctr * 10000) / 100 : 0,
      }));
    } catch (err: any) {
      console.error(`[LiveSEO] Search Console error for ${siteUrl}:`, err.message);
      return mockFallback.getRankings(campaignId, startDate, endDate);
    }
  }

  async getPageAudits(campaignId: number): Promise<SEOPageAudit[]> {
    return mockFallback.getPageAudits(campaignId);
  }

  async getBacklinks(campaignId: number): Promise<BacklinkData[]> {
    return mockFallback.getBacklinks(campaignId);
  }

  async getTechnicalIssues(campaignId: number): Promise<TechnicalIssue[]> {
    return mockFallback.getTechnicalIssues(campaignId);
  }
}
