import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getRules, getRule, createRule, updateRule, deleteRule,
  getActionLogs, executeAction, evaluateRules, getSuggestions,
} from '../services/auto-optimize.service.js';

const router = Router();
router.use(authMiddleware);

// === Rules CRUD ===

// GET /api/optimize/rules?campaignId=1
router.get('/rules', (req: Request, res: Response): void => {
  const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
  res.json(getRules(campaignId));
});

// GET /api/optimize/rules/:id
router.get('/rules/:id', (req: Request, res: Response): void => {
  const rule = getRule(parseInt(req.params.id as string));
  if (!rule) { res.status(404).json({ error: 'Rule not found' }); return; }
  res.json(rule);
});

// POST /api/optimize/rules
router.post('/rules', (req: Request, res: Response): void => {
  const rule = createRule({
    tenantId: req.user!.tenantId,
    ...req.body,
  });
  res.status(201).json(rule);
});

// PATCH /api/optimize/rules/:id
router.patch('/rules/:id', (req: Request, res: Response): void => {
  const updated = updateRule(parseInt(req.params.id as string), req.body);
  if (!updated) { res.status(404).json({ error: 'Rule not found' }); return; }
  res.json(updated);
});

// DELETE /api/optimize/rules/:id
router.delete('/rules/:id', (req: Request, res: Response): void => {
  const deleted = deleteRule(parseInt(req.params.id as string));
  if (!deleted) { res.status(404).json({ error: 'Rule not found' }); return; }
  res.json({ message: 'Rule deleted' });
});

// === Actions ===

// POST /api/optimize/execute — execute manual action
router.post('/execute', async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId, actionType, target, params } = req.body;

    if (!campaignId || !actionType || !target) {
      res.status(400).json({ error: 'campaignId, actionType, and target are required' });
      return;
    }

    const log = await executeAction(
      campaignId,
      actionType,
      target,
      params || {},
      'manual',
      req.user!.userId
    );
    res.json(log);
  } catch (err: any) {
    console.error('[Optimize] execute error:', err.message);
    res.status(500).json({ error: 'Failed to execute optimization action' });
  }
});

// POST /api/optimize/evaluate/:campaignId — run all rules
router.post('/evaluate/:campaignId', async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const triggered = await evaluateRules(campaignId);
    res.json({ triggered: triggered.length, actions: triggered });
  } catch (err: any) {
    console.error('[Optimize] evaluate error:', err.message);
    res.status(500).json({ error: 'Failed to evaluate optimization rules' });
  }
});

// === Logs ===

// GET /api/optimize/logs?campaignId=1
router.get('/logs', (req: Request, res: Response): void => {
  const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  res.json(getActionLogs(campaignId, limit));
});

// === Suggestions ===

// GET /api/optimize/suggestions?campaignId=1
router.get('/suggestions', (req: Request, res: Response): void => {
  const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
  res.json(getSuggestions(campaignId));
});

// POST /api/optimize/suggestions/:id/apply — apply a suggestion
router.post('/suggestions/:id/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const suggestions = getSuggestions();
    const suggestion = suggestions.find(s => s.id === (req.params.id as string));

    if (!suggestion) {
      res.status(404).json({ error: 'Suggestion not found' });
      return;
    }

    const log = await executeAction(
      suggestion.campaignId,
      suggestion.actionType,
      suggestion.targetEntity,
      { ...suggestion.suggestedValue, reason: suggestion.reason },
      'ai',
      req.user!.userId
    );

    res.json({ message: 'Suggestion applied', action: log });
  } catch (err: any) {
    console.error('[Optimize] apply suggestion error:', err.message);
    res.status(500).json({ error: 'Failed to apply suggestion' });
  }
});

export default router;
