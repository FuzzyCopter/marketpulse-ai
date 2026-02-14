import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAlertRules, getAlertRule, createAlertRule, updateAlertRule, deleteAlertRule,
  getAlertEvents, acknowledgeEvent, acknowledgeAll, evaluateAlertRules, getAlertStats,
} from '../services/alerts.service.js';

const router = Router();
router.use(authMiddleware);

// === Rules ===

router.get('/rules', (req: Request, res: Response): void => {
  const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
  res.json(getAlertRules(campaignId));
});

router.get('/rules/:id', (req: Request, res: Response): void => {
  const rule = getAlertRule(parseInt(req.params.id));
  if (!rule) { res.status(404).json({ error: 'Rule not found' }); return; }
  res.json(rule);
});

router.post('/rules', (req: Request, res: Response): void => {
  const rule = createAlertRule({ tenantId: req.user!.tenantId, ...req.body });
  res.status(201).json(rule);
});

router.patch('/rules/:id', (req: Request, res: Response): void => {
  const updated = updateAlertRule(parseInt(req.params.id), req.body);
  if (!updated) { res.status(404).json({ error: 'Rule not found' }); return; }
  res.json(updated);
});

router.delete('/rules/:id', (req: Request, res: Response): void => {
  const deleted = deleteAlertRule(parseInt(req.params.id));
  if (!deleted) { res.status(404).json({ error: 'Rule not found' }); return; }
  res.json({ message: 'Rule deleted' });
});

// === Events ===

router.get('/events', (req: Request, res: Response): void => {
  const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
  const acknowledged = req.query.acknowledged !== undefined ? req.query.acknowledged === 'true' : undefined;
  res.json(getAlertEvents(campaignId, acknowledged));
});

router.post('/events/:id/acknowledge', (req: Request, res: Response): void => {
  const event = acknowledgeEvent(parseInt(req.params.id), req.user!.userId);
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
  res.json(event);
});

router.post('/events/acknowledge-all', (req: Request, res: Response): void => {
  const { campaignId } = req.body;
  if (!campaignId) { res.status(400).json({ error: 'campaignId required' }); return; }
  const count = acknowledgeAll(campaignId, req.user!.userId);
  res.json({ acknowledged: count });
});

// === Evaluate ===

router.post('/evaluate/:campaignId', async (req: Request, res: Response): Promise<void> => {
  const triggered = await evaluateAlertRules(parseInt(req.params.campaignId));
  res.json({ triggered: triggered.length, events: triggered });
});

// === Stats ===

router.get('/stats/:campaignId', (req: Request, res: Response): void => {
  res.json(getAlertStats(parseInt(req.params.campaignId)));
});

export default router;
