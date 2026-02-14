import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// ── In-memory stores ──────────────────────────────────────────────
interface Client {
  id: number;
  tenantId: number;
  name: string;
  industry: string;
  createdAt: string;
}

interface CampaignChannel {
  channelType: string;
  targetMetric: string;
  targetValue: number;
  budget: number;
}

interface ManagedCampaign {
  id: number;
  tenantId: number;
  clientId: number;
  clientName: string;
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalBudget: number;
  channels: CampaignChannel[];
  createdAt: string;
}

// Seed with Honda
const clients: Client[] = [
  { id: 1, tenantId: 1, name: 'Honda Indonesia (AHM)', industry: 'Automotive', createdAt: '2026-01-01T00:00:00Z' },
];

const managedCampaigns: ManagedCampaign[] = [];

let nextClientId = 2;
let nextCampaignId = 100; // Start high to avoid collision with hardcoded ids 1,2

// ── Client CRUD ───────────────────────────────────────────────────

router.get('/clients', authMiddleware, (_req: Request, res: Response): void => {
  res.json(clients);
});

router.post('/clients', authMiddleware, (req: Request, res: Response): void => {
  const { name, industry } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  const client: Client = {
    id: nextClientId++,
    tenantId: 1,
    name,
    industry: industry || '',
    createdAt: new Date().toISOString(),
  };
  clients.push(client);
  res.status(201).json(client);
});

router.patch('/clients/:id', authMiddleware, (req: Request, res: Response): void => {
  const id = parseInt(req.params.id as string, 10);
  const client = clients.find(c => c.id === id);
  if (!client) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }
  if (req.body.name) client.name = req.body.name;
  if (req.body.industry !== undefined) client.industry = req.body.industry;
  res.json(client);
});

router.delete('/clients/:id', authMiddleware, (req: Request, res: Response): void => {
  const id = parseInt(req.params.id as string, 10);
  if (id === 1) {
    res.status(400).json({ error: 'Cannot delete default client' });
    return;
  }
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }
  // Check if client has campaigns
  const hasCampaigns = managedCampaigns.some(c => c.clientId === id);
  if (hasCampaigns) {
    res.status(400).json({ error: 'Cannot delete client with active campaigns' });
    return;
  }
  clients.splice(idx, 1);
  res.json({ success: true });
});

// ── Campaign CRUD ─────────────────────────────────────────────────

router.get('/campaigns', authMiddleware, (_req: Request, res: Response): void => {
  res.json(managedCampaigns);
});

router.post('/campaigns', authMiddleware, (req: Request, res: Response): void => {
  const { clientId, name, description, startDate, endDate, channels } = req.body;

  if (!clientId || !name || !startDate || !endDate) {
    res.status(400).json({ error: 'clientId, name, startDate, endDate are required' });
    return;
  }

  const client = clients.find(c => c.id === clientId);
  if (!client) {
    res.status(400).json({ error: 'Client not found' });
    return;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const campaignChannels: CampaignChannel[] = (channels || []).map((ch: any) => ({
    channelType: ch.channelType,
    targetMetric: ch.targetMetric || 'clicks',
    targetValue: ch.targetValue || 0,
    budget: ch.budget || 0,
  }));

  const totalBudget = campaignChannels.reduce((sum, ch) => sum + ch.budget, 0);

  const campaign: ManagedCampaign = {
    id: nextCampaignId++,
    tenantId: 1,
    clientId,
    clientName: client.name,
    name,
    slug,
    description: description || '',
    startDate,
    endDate,
    totalDays,
    totalBudget,
    channels: campaignChannels,
    createdAt: new Date().toISOString(),
  };

  managedCampaigns.push(campaign);
  res.status(201).json(campaign);
});

router.patch('/campaigns/:id', authMiddleware, (req: Request, res: Response): void => {
  const id = parseInt(req.params.id as string, 10);
  const campaign = managedCampaigns.find(c => c.id === id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  if (req.body.name) campaign.name = req.body.name;
  if (req.body.description !== undefined) campaign.description = req.body.description;
  if (req.body.startDate) campaign.startDate = req.body.startDate;
  if (req.body.endDate) campaign.endDate = req.body.endDate;
  if (req.body.channels) {
    campaign.channels = req.body.channels;
    campaign.totalBudget = campaign.channels.reduce((sum, ch) => sum + ch.budget, 0);
  }

  if (req.body.startDate || req.body.endDate) {
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    campaign.totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  res.json(campaign);
});

router.delete('/campaigns/:id', authMiddleware, (req: Request, res: Response): void => {
  const id = parseInt(req.params.id as string, 10);
  const idx = managedCampaigns.findIndex(c => c.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  managedCampaigns.splice(idx, 1);
  res.json({ success: true });
});

// ── Export managed data for other routes ──────────────────────────
export function getManagedCampaigns() {
  return managedCampaigns;
}

export function getClients() {
  return clients;
}

export default router;
