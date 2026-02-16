import { Router, Request, Response } from 'express';
import { HONDA_CAMPAIGNS, CHANNEL_LABELS } from '@marketpulse/shared';
import type { KPIProgress, ChannelMetrics, DashboardOverview } from '@marketpulse/shared';
import { authMiddleware } from '../middleware/auth.js';
import { getSearchAdsProvider, getDiscoveryAdsProvider, getSocialMediaProvider } from '../datasources/index.js';
import { getManagedCampaigns } from './manage.routes.js';

const router = Router();

// Mock campaign list
const CAMPAIGNS = [
  { id: 1, ...HONDA_CAMPAIGNS.MBBH_2026, clientId: 1 },
  { id: 2, ...HONDA_CAMPAIGNS.BALE_SANTAI, clientId: 1 },
];

function getCampaignStatus(startDate: string, endDate: string): string {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'completed';
  return 'active';
}

function getDaysElapsed(startDate: string, endDate: string): number {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (today < start) return 0;
  if (today > end) return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

router.get('/overview', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const overviews = [];

    for (const camp of CAMPAIGNS) {
      const status = getCampaignStatus(camp.startDate, camp.endDate);
      overviews.push({
        id: camp.id,
        name: camp.name,
        slug: camp.slug,
        status,
        startDate: camp.startDate,
        endDate: camp.endDate,
        totalDays: camp.totalDays,
        daysElapsed: getDaysElapsed(camp.startDate, camp.endDate),
      });
    }

    // Include user-created campaigns
    for (const mc of getManagedCampaigns()) {
      overviews.push({
        id: mc.id,
        name: mc.name,
        slug: mc.slug,
        status: getCampaignStatus(mc.startDate, mc.endDate),
        startDate: mc.startDate,
        endDate: mc.endDate,
        totalDays: mc.totalDays,
        daysElapsed: getDaysElapsed(mc.startDate, mc.endDate),
      });
    }

    res.json({ campaigns: overviews });
  } catch (err: any) {
    console.error('[Dashboard] overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

router.get('/campaign/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.id as string, 10);
    const camp = CAMPAIGNS.find(c => c.id === campaignId);

    if (!camp) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const searchProvider = getSearchAdsProvider();
    const discoveryProvider = getDiscoveryAdsProvider();
    const socialProvider = getSocialMediaProvider();

    const today = new Date().toISOString().split('T')[0];
    const effectiveEnd = today < camp.endDate ? today : camp.endDate;

    const [searchMetrics, discoveryMetrics, socialMetrics] = await Promise.all([
      searchProvider.getMetrics({ campaignId, startDate: camp.startDate, endDate: effectiveEnd, granularity: 'daily' }),
      discoveryProvider.getMetrics({ campaignId, startDate: camp.startDate, endDate: effectiveEnd, granularity: 'daily' }),
      socialProvider.getMetrics({ campaignId, startDate: camp.startDate, endDate: effectiveEnd, granularity: 'daily' }),
    ]);

    const daysElapsed = getDaysElapsed(camp.startDate, camp.endDate);
    const status = getCampaignStatus(camp.startDate, camp.endDate);

    // Build KPI progress
    const kpis: KPIProgress[] = [];

    for (const channel of camp.channels) {
      const metrics = channel.channelType === 'google_search' ? searchMetrics : discoveryMetrics;
      const actual = channel.targetMetric === 'clicks' ? metrics.totals.clicks : metrics.totals.visits;
      const projected = daysElapsed > 0 ? Math.round((actual / daysElapsed) * camp.totalDays) : 0;

      kpis.push({
        metricName: `${CHANNEL_LABELS[channel.channelType]} ${channel.targetMetric}`,
        target: channel.targetValue,
        actual,
        percentage: parseFloat(((actual / channel.targetValue) * 100).toFixed(1)),
        trend: actual > (channel.targetValue * daysElapsed / camp.totalDays) ? 'up' : 'down',
        onTrack: projected >= channel.targetValue * 0.9,
        projected,
        daysRemaining: Math.max(0, camp.totalDays - daysElapsed),
      });
    }

    // Social media KPI
    const socialTotal = camp.socialBreakdown.reduce((s, b) => s + b.targetClicks, 0);
    const socialProjected = daysElapsed > 0 ? Math.round((socialMetrics.totals.clicks / daysElapsed) * camp.totalDays) : 0;
    kpis.push({
      metricName: 'Social Media clicks',
      target: socialTotal,
      actual: socialMetrics.totals.clicks,
      percentage: parseFloat(((socialMetrics.totals.clicks / socialTotal) * 100).toFixed(1)),
      trend: socialMetrics.totals.clicks > (socialTotal * daysElapsed / camp.totalDays) ? 'up' : 'down',
      onTrack: socialProjected >= socialTotal * 0.9,
      projected: socialProjected,
      daysRemaining: Math.max(0, camp.totalDays - daysElapsed),
    });

    // Channel breakdown
    const channelBreakdown: ChannelMetrics[] = [
      {
        channelType: 'google_search',
        label: CHANNEL_LABELS.google_search,
        metrics: searchMetrics.totals,
        target: camp.channels[0].targetValue,
        targetMetric: camp.channels[0].targetMetric,
        progress: parseFloat(((searchMetrics.totals.clicks / camp.channels[0].targetValue) * 100).toFixed(1)),
      },
      {
        channelType: 'google_discovery',
        label: CHANNEL_LABELS.google_discovery,
        metrics: discoveryMetrics.totals,
        target: camp.channels[1].targetValue,
        targetMetric: camp.channels[1].targetMetric,
        progress: parseFloat(((discoveryMetrics.totals.visits / camp.channels[1].targetValue) * 100).toFixed(1)),
      },
      {
        channelType: 'social_tiktok',
        label: 'Social Media (Combined)',
        metrics: socialMetrics.totals,
        target: socialTotal,
        targetMetric: 'clicks',
        progress: parseFloat(((socialMetrics.totals.clicks / socialTotal) * 100).toFixed(1)),
      },
    ];

    // Today's metrics (last day of data)
    const todaySearch = searchMetrics.data.find(d => d.metricDate === today);
    const todayDiscovery = discoveryMetrics.data.find(d => d.metricDate === today);
    const todaySocial = socialMetrics.data.find(d => d.metricDate === today);

    const todayMetrics = {
      impressions: (todaySearch?.impressions || 0) + (todayDiscovery?.impressions || 0) + (todaySocial?.impressions || 0),
      clicks: (todaySearch?.clicks || 0) + (todayDiscovery?.clicks || 0) + (todaySocial?.clicks || 0),
      visits: (todaySearch?.visits || 0) + (todayDiscovery?.visits || 0) + (todaySocial?.visits || 0),
      conversions: (todaySearch?.conversions || 0) + (todayDiscovery?.conversions || 0) + (todaySocial?.conversions || 0),
      cost: (todaySearch?.cost || 0) + (todayDiscovery?.cost || 0) + (todaySocial?.cost || 0),
      avgCtr: 0, avgCpc: 0, avgConversionRate: 0,
    };

    const overview: DashboardOverview = {
      campaign: {
        id: campaignId,
        name: camp.name,
        status,
        startDate: camp.startDate,
        endDate: camp.endDate,
        daysElapsed,
        totalDays: camp.totalDays,
      },
      kpis,
      channelBreakdown,
      todayMetrics,
      weekMetrics: {
        impressions: searchMetrics.totals.impressions + discoveryMetrics.totals.impressions + socialMetrics.totals.impressions,
        clicks: searchMetrics.totals.clicks + discoveryMetrics.totals.clicks + socialMetrics.totals.clicks,
        visits: searchMetrics.totals.visits + discoveryMetrics.totals.visits + socialMetrics.totals.visits,
        conversions: searchMetrics.totals.conversions + discoveryMetrics.totals.conversions + socialMetrics.totals.conversions,
        cost: searchMetrics.totals.cost + discoveryMetrics.totals.cost + socialMetrics.totals.cost,
        avgCtr: 0, avgCpc: 0, avgConversionRate: 0,
      },
    };

    res.json(overview);
  } catch (err: any) {
    console.error('[Dashboard] campaign detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch campaign details' });
  }
});

export default router;
