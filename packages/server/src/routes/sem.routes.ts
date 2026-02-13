import { Router, Request, Response } from 'express';
import { HONDA_CAMPAIGNS } from '@marketpulse/shared';
import { authMiddleware } from '../middleware/auth.js';
import { getSearchAdsProvider } from '../datasources/index.js';

const router = Router();

router.get('/campaigns/:id/keywords', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const provider = getSearchAdsProvider();
  const keywords = await provider.getKeywords(campaignId);
  res.json({ keywords });
});

router.get('/campaigns/:id/keywords/:kwId/metrics', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const keywordId = parseInt(req.params.kwId, 10);
  const campaignId = parseInt(req.params.id, 10);
  const campaign = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;

  const startDate = (req.query.startDate as string) || campaign.startDate;
  const endDate = (req.query.endDate as string) || campaign.endDate;

  const provider = getSearchAdsProvider();
  const metrics = await provider.getKeywordMetrics(keywordId, startDate, endDate);
  res.json({ metrics });
});

router.get('/campaigns/:id/ad-groups', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const provider = getSearchAdsProvider();
  const adGroups = await provider.getAdGroups(campaignId);
  res.json({ adGroups });
});

router.get('/campaigns/:id/search-terms', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const campaign = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;
  const startDate = (req.query.startDate as string) || campaign.startDate;
  const endDate = (req.query.endDate as string) || campaign.endDate;

  const provider = getSearchAdsProvider();
  const searchTerms = await provider.getSearchTerms(campaignId, startDate, endDate);
  res.json({ searchTerms });
});

router.get('/campaigns/:id/bid-suggestions', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const provider = getSearchAdsProvider();
  const suggestions = await provider.getBidSuggestions(campaignId);
  res.json({ suggestions });
});

export default router;
