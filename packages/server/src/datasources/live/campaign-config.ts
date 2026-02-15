import { HONDA_CAMPAIGNS } from '@marketpulse/shared';
import { getManagedCampaigns } from '../../routes/manage.routes.js';
import { env } from '../../config/env.js';

interface CampaignConfig {
  siteUrl: string;
  adsCustomerId: string;
}

const HARDCODED_MAP: Record<number, string> = {
  1: 'MBBH_2026',
  2: 'BALE_SANTAI',
};

/**
 * Resolve per-campaign config (siteUrl, adsCustomerId).
 * Checks hardcoded Honda campaigns first, then managed campaigns, then falls back to .env defaults.
 */
export function getCampaignConfig(campaignId: number): CampaignConfig {
  // Check hardcoded Honda campaigns
  const key = HARDCODED_MAP[campaignId];
  if (key && HONDA_CAMPAIGNS[key]) {
    const campaign = HONDA_CAMPAIGNS[key];
    return {
      siteUrl: campaign.siteUrl || env.google.searchConsoleSiteUrl,
      adsCustomerId: campaign.adsCustomerId || env.google.adsCustomerId,
    };
  }

  // Check managed campaigns
  const managed = getManagedCampaigns().find(c => c.id === campaignId);
  if (managed) {
    return {
      siteUrl: (managed as any).siteUrl || env.google.searchConsoleSiteUrl,
      adsCustomerId: (managed as any).adsCustomerId || env.google.adsCustomerId,
    };
  }

  // Fallback to .env defaults
  return {
    siteUrl: env.google.searchConsoleSiteUrl,
    adsCustomerId: env.google.adsCustomerId,
  };
}
