import { Router, Request, Response } from 'express';
import { HONDA_CAMPAIGNS } from '@marketpulse/shared';
import { authMiddleware } from '../middleware/auth.js';
import { getSearchAdsProvider } from '../datasources/index.js';

const router = Router();

router.get('/campaigns/:id/keywords', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.id as string, 10);
    const provider = getSearchAdsProvider();
    const keywords = await provider.getKeywords(campaignId);
    res.json({ keywords });
  } catch (err: any) {
    console.error('[SEM] keywords error:', err.message);
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
});

router.get('/campaigns/:id/keywords/:kwId/metrics', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const keywordId = parseInt(req.params.kwId as string, 10);
    const campaignId = parseInt(req.params.id as string, 10);
    const campaign = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;

    const startDate = (req.query.startDate as string) || campaign.startDate;
    const endDate = (req.query.endDate as string) || campaign.endDate;

    const provider = getSearchAdsProvider();
    const metrics = await provider.getKeywordMetrics(keywordId, startDate, endDate);
    res.json({ metrics });
  } catch (err: any) {
    console.error('[SEM] keyword metrics error:', err.message);
    res.status(500).json({ error: 'Failed to fetch keyword metrics' });
  }
});

router.get('/campaigns/:id/ad-groups', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.id as string, 10);
    const provider = getSearchAdsProvider();
    const adGroups = await provider.getAdGroups(campaignId);
    res.json({ adGroups });
  } catch (err: any) {
    console.error('[SEM] ad-groups error:', err.message);
    res.status(500).json({ error: 'Failed to fetch ad groups' });
  }
});

router.get('/campaigns/:id/search-terms', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.id as string, 10);
    const campaign = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;
    const startDate = (req.query.startDate as string) || campaign.startDate;
    const endDate = (req.query.endDate as string) || campaign.endDate;

    const provider = getSearchAdsProvider();
    const searchTerms = await provider.getSearchTerms(campaignId, startDate, endDate);
    res.json({ searchTerms });
  } catch (err: any) {
    console.error('[SEM] search-terms error:', err.message);
    res.status(500).json({ error: 'Failed to fetch search terms' });
  }
});

router.get('/campaigns/:id/bid-suggestions', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.id as string, 10);
    const provider = getSearchAdsProvider();
    const suggestions = await provider.getBidSuggestions(campaignId);
    res.json({ suggestions });
  } catch (err: any) {
    console.error('[SEM] bid-suggestions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bid suggestions' });
  }
});

export default router;
