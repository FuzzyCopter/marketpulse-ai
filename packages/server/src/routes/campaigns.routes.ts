import { Router, Request, Response } from 'express';
import { HONDA_CAMPAIGNS, CHANNEL_LABELS } from '@marketpulse/shared';
import { authMiddleware } from '../middleware/auth.js';
import { getSearchAdsProvider, getDiscoveryAdsProvider, getSocialMediaProvider } from '../datasources/index.js';
import { getManagedCampaigns } from './manage.routes.js';

const router = Router();

const CAMPAIGNS = [
  { id: 1, tenantId: 1, clientId: 1, ...HONDA_CAMPAIGNS.MBBH_2026 },
  { id: 2, tenantId: 1, clientId: 1, ...HONDA_CAMPAIGNS.BALE_SANTAI },
];

router.get('/', authMiddleware, (_req: Request, res: Response): void => {
  const managed = getManagedCampaigns().map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    client: c.clientName,
    startDate: c.startDate,
    endDate: c.endDate,
    totalDays: c.totalDays,
    status: getStatus(c.startDate, c.endDate),
  }));

  res.json({
    campaigns: [
      ...CAMPAIGNS.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        client: c.client,
        startDate: c.startDate,
        endDate: c.endDate,
        totalDays: c.totalDays,
        status: getStatus(c.startDate, c.endDate),
      })),
      ...managed,
    ],
  });
});

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  const id = parseInt(req.params.id, 10);
  const campaign = CAMPAIGNS.find(c => c.id === id);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  res.json({
    ...campaign,
    status: getStatus(campaign.startDate, campaign.endDate),
    channelLabels: CHANNEL_LABELS,
  });
});

router.get('/:id/metrics', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const channel = req.query.channel as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const granularity = (req.query.granularity as 'daily' | 'weekly') || 'daily';

  const campaign = CAMPAIGNS.find(c => c.id === campaignId);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const qStartDate = startDate || campaign.startDate;
  const qEndDate = endDate || campaign.endDate;
  const query = { campaignId, startDate: qStartDate, endDate: qEndDate, granularity };

  if (channel === 'google_search') {
    const result = await getSearchAdsProvider().getMetrics(query);
    res.json(result);
    return;
  }
  if (channel === 'google_discovery') {
    const result = await getDiscoveryAdsProvider().getMetrics(query);
    res.json(result);
    return;
  }
  if (channel?.startsWith('social')) {
    const result = await getSocialMediaProvider().getMetrics({ ...query, channelType: 'social_tiktok' });
    res.json(result);
    return;
  }

  // All channels combined
  const [search, discovery, social] = await Promise.all([
    getSearchAdsProvider().getMetrics(query),
    getDiscoveryAdsProvider().getMetrics(query),
    getSocialMediaProvider().getMetrics(query),
  ]);

  res.json({
    channels: {
      google_search: search,
      google_discovery: discovery,
      social_media: social,
    },
  });
});

function getStatus(startDate: string, endDate: string): string {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'completed';
  return 'active';
}

export default router;
