import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAIInsights, clearInsightCache } from '../services/ai.service.js';
import { getSearchAdsProvider } from '../datasources/index.js';
import { HONDA_CAMPAIGNS } from '@marketpulse/shared';
import { generateSuggestions } from '../services/auto-optimize.service.js';

const router = Router();
router.use(authMiddleware);

// GET /api/ai/insights/:campaignId
router.get('/insights/:campaignId', async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.campaignId);
  const type = (req.query.type as string) || 'performance';

  // Build analysis input from campaign data
  const campaignDef = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;
  const now = new Date();
  const startDate = new Date(campaignDef.startDate);
  const endDate = new Date(campaignDef.endDate);
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const status = now < startDate ? 'upcoming' : now > endDate ? 'completed' : 'active';

  // Get keyword data for SEM analysis
  const searchProvider = getSearchAdsProvider();
  const keywords = await searchProvider.getKeywords(campaignId);

  // Build KPI progress
  const kpiProgress = campaignDef.channels.map(ch => {
    const target = ch.targetValue;
    const dailyRate = target / campaignDef.totalDays;
    const current = status === 'upcoming' ? 0 : Math.round(dailyRate * daysElapsed * (0.85 + Math.random() * 0.3));
    const progressPercent = target > 0 ? Math.round((current / target) * 100) : 0;
    const projectedTotal = daysElapsed > 0 ? Math.round((current / daysElapsed) * campaignDef.totalDays) : 0;

    return {
      channel: ch.label,
      metric: ch.targetMetric,
      current,
      target,
      progressPercent,
      projectedTotal,
      onTrack: projectedTotal >= target * 0.9,
    };
  });

  const analysisInput = {
    campaign: {
      name: campaignDef.name,
      startDate: campaignDef.startDate,
      endDate: campaignDef.endDate,
      status,
      daysElapsed,
      totalDays: campaignDef.totalDays,
    },
    kpiProgress,
    keywords,
  };

  const insights = await getAIInsights(campaignId, analysisInput, type as 'performance' | 'optimize');

  // Auto-generate optimization suggestions from AI insights
  if (type === 'optimize') {
    generateSuggestions(campaignId, insights);
  }

  res.json({ insights, campaign: analysisInput.campaign, kpiProgress });
});

// POST /api/ai/refresh/:campaignId — force refresh cache
router.post('/refresh/:campaignId', async (req: Request, res: Response): Promise<void> => {
  const campaignId = parseInt(req.params.campaignId);
  clearInsightCache(campaignId);
  res.json({ message: 'Cache cleared', campaignId });
});

export default router;
