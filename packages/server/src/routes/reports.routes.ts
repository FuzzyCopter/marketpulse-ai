import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateReport, getReports, getReport, generateReportHTML } from '../services/reports.service.js';

const router = Router();

// HTML endpoints accept token via query param (for new tab/print)
function optionalAuth(req: Request, res: Response, next: () => void): void {
  const queryToken = req.query.token as string;
  if (queryToken) {
    try {
      jwt.verify(queryToken, env.jwtSecret);
      next();
      return;
    } catch { /* fall through */ }
  }
  authMiddleware(req, res, next);
}

// GET /api/reports/:id/html — get report as HTML (for PDF/print)
router.get('/:id/html', optionalAuth, (req: Request, res: Response): void => {
  const report = getReport(req.params.id as string);
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
  const html = generateReportHTML(report.data);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// GET /api/reports/preview/:campaignId — preview report
router.get('/preview/:campaignId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const type = (req.query.type as string) || 'weekly';
    const reportData = await generateReport(campaignId, type as 'weekly' | 'monthly' | 'campaign');
    const html = generateReportHTML(reportData);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err: any) {
    console.error('[Reports] preview error:', err.message);
    res.status(500).json({ error: 'Failed to generate report preview' });
  }
});

// All other routes require auth
router.use(authMiddleware);

// GET /api/reports?campaignId=1
router.get('/', (req: Request, res: Response): void => {
  const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
  res.json(getReports(campaignId));
});

// POST /api/reports/generate
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId, type } = req.body;
    if (!campaignId) { res.status(400).json({ error: 'campaignId required' }); return; }
    const reportData = await generateReport(campaignId, type || 'weekly');
    res.json(reportData);
  } catch (err: any) {
    console.error('[Reports] generate error:', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/:id
router.get('/:id', (req: Request, res: Response): void => {
  const report = getReport(req.params.id as string);
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
  res.json(report);
});

export default router;
