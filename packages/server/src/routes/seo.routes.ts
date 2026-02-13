import { Router, Request, Response } from 'express';
import { HONDA_CAMPAIGNS } from '@marketpulse/shared';
import { authMiddleware } from '../middleware/auth.js';
import { getSEOProvider } from '../datasources/index.js';

const router = Router();

router.get('/campaigns/:id/rankings', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const campaign = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;
  const startDate = (req.query.startDate as string) || campaign.startDate;
  const endDate = (req.query.endDate as string) || campaign.endDate;

  const provider = getSEOProvider();
  const rankings = await provider.getRankings(campaignId, startDate, endDate);
  res.json({ rankings });
});

router.get('/campaigns/:id/pages', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const provider = getSEOProvider();
  const pages = await provider.getPageAudits(campaignId);
  res.json({ pages });
});

router.get('/campaigns/:id/backlinks', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const provider = getSEOProvider();
  const backlinks = await provider.getBacklinks(campaignId);
  res.json({ backlinks });
});

router.get('/campaigns/:id/technical', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.id, 10);
  const provider = getSEOProvider();
  const issues = await provider.getTechnicalIssues(campaignId);
  res.json({ issues });
});

export default router;
