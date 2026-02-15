import type { ChannelType } from '../types/campaign.js';

export interface ChannelTarget {
  label: string;
  channelType: ChannelType;
  targetMetric: 'clicks' | 'visits';
  targetValue: number;
  estimatedImpressions: number;
  estimatedCTR: number;
  estimatedCPC: number;
  estimatedBudget: number;
}

export interface SocialBreakdown {
  platform: 'tiktok' | 'instagram' | 'facebook';
  channelType: ChannelType;
  percentage: number;
  targetClicks: number;
}

export interface CampaignDefinition {
  name: string;
  slug: string;
  client: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  siteUrl?: string;
  adsCustomerId?: string;
  audience: {
    gender: string;
    ageRange: string;
    location: string;
    focus: string;
  };
  channels: ChannelTarget[];
  socialBreakdown: SocialBreakdown[];
}

export const HONDA_CAMPAIGNS: Record<string, CampaignDefinition> = {
  MBBH_2026: {
    name: 'Mudik Bareng Honda (MBBH) 2026',
    slug: 'mbbh-2026',
    client: 'Honda Indonesia (AHM)',
    startDate: '2026-02-14',
    endDate: '2026-02-28',
    totalDays: 15,
    siteUrl: 'https://www.astra-honda.com',
    adsCustomerId: '7358954850',
    audience: {
      gender: 'Male & Female',
      ageRange: '25-50',
      location: 'Jawa & Bali',
      focus: 'Perantau di Jakarta',
    },
    channels: [
      {
        label: 'Google Search (SEM)',
        channelType: 'google_search',
        targetMetric: 'clicks',
        targetValue: 30_000,
        estimatedImpressions: 600_000,
        estimatedCTR: 0.05,
        estimatedCPC: 1_500,
        estimatedBudget: 45_000_000,
      },
      {
        label: 'Google Discovery',
        channelType: 'google_discovery',
        targetMetric: 'visits',
        targetValue: 50_000,
        estimatedImpressions: 2_500_000,
        estimatedCTR: 0.02,
        estimatedCPC: 500,
        estimatedBudget: 25_000_000,
      },
    ],
    socialBreakdown: [
      { platform: 'tiktok', channelType: 'social_tiktok', percentage: 0.40, targetClicks: 2_000 },
      { platform: 'instagram', channelType: 'social_instagram', percentage: 0.35, targetClicks: 1_750 },
      { platform: 'facebook', channelType: 'social_facebook', percentage: 0.25, targetClicks: 1_250 },
    ],
  },

  BALE_SANTAI: {
    name: 'Bale Santai Honda',
    slug: 'bale-santai-honda',
    client: 'Honda Indonesia (AHM)',
    startDate: '2026-03-08',
    endDate: '2026-03-28',
    totalDays: 21,
    siteUrl: 'https://www.astra-honda.com',
    adsCustomerId: '7358954850',
    audience: {
      gender: 'Male & Female',
      ageRange: '25-50',
      location: 'Jawa & Bali',
      focus: 'Perantau di Jakarta',
    },
    channels: [
      {
        label: 'Google Search (SEM)',
        channelType: 'google_search',
        targetMetric: 'clicks',
        targetValue: 5_000,
        estimatedImpressions: 100_000,
        estimatedCTR: 0.05,
        estimatedCPC: 1_800,
        estimatedBudget: 9_000_000,
      },
      {
        label: 'Google Discovery',
        channelType: 'google_discovery',
        targetMetric: 'visits',
        targetValue: 5_000,
        estimatedImpressions: 250_000,
        estimatedCTR: 0.02,
        estimatedCPC: 600,
        estimatedBudget: 3_000_000,
      },
    ],
    socialBreakdown: [
      { platform: 'tiktok', channelType: 'social_tiktok', percentage: 0.40, targetClicks: 2_000 },
      { platform: 'instagram', channelType: 'social_instagram', percentage: 0.35, targetClicks: 1_750 },
      { platform: 'facebook', channelType: 'social_facebook', percentage: 0.25, targetClicks: 1_250 },
    ],
  },
};

export const MBBH_SEM_KEYWORDS = [
  { keyword: 'mudik bareng honda 2026', matchType: 'exact' as const, qualityScore: 9, avgCpc: 800, adGroup: 'Brand - Exact' },
  { keyword: 'mudik gratis honda', matchType: 'phrase' as const, qualityScore: 8, avgCpc: 1_200, adGroup: 'Brand - Phrase' },
  { keyword: 'daftar mudik honda', matchType: 'exact' as const, qualityScore: 9, avgCpc: 900, adGroup: 'Registration' },
  { keyword: 'mudik bareng motor honda', matchType: 'broad' as const, qualityScore: 7, avgCpc: 1_500, adGroup: 'Generic - Motor' },
  { keyword: 'honda mudik lebaran 2026', matchType: 'phrase' as const, qualityScore: 8, avgCpc: 1_100, adGroup: 'Brand - Seasonal' },
  { keyword: 'program mudik honda', matchType: 'broad' as const, qualityScore: 7, avgCpc: 1_400, adGroup: 'Program' },
  { keyword: 'mudik aman honda', matchType: 'phrase' as const, qualityScore: 6, avgCpc: 1_800, adGroup: 'Safety' },
  { keyword: 'cara daftar mudik bareng honda', matchType: 'exact' as const, qualityScore: 9, avgCpc: 700, adGroup: 'Registration' },
  { keyword: 'jadwal mudik honda 2026', matchType: 'exact' as const, qualityScore: 8, avgCpc: 950, adGroup: 'Schedule' },
  { keyword: 'biaya mudik bareng honda', matchType: 'phrase' as const, qualityScore: 8, avgCpc: 1_000, adGroup: 'Cost' },
  { keyword: 'rute mudik honda', matchType: 'broad' as const, qualityScore: 6, avgCpc: 1_600, adGroup: 'Route' },
  { keyword: 'mudik motor gratis 2026', matchType: 'broad' as const, qualityScore: 5, avgCpc: 2_000, adGroup: 'Generic - Free' },
  { keyword: 'honda care mudik', matchType: 'phrase' as const, qualityScore: 7, avgCpc: 1_300, adGroup: 'Brand - Care' },
  { keyword: 'astra honda mudik', matchType: 'exact' as const, qualityScore: 9, avgCpc: 850, adGroup: 'Brand - Exact' },
  { keyword: 'registrasi mudik honda', matchType: 'exact' as const, qualityScore: 8, avgCpc: 950, adGroup: 'Registration' },
];

export const MBBH_SEO_KEYWORDS = [
  { keyword: 'mudik bareng honda', position: 1, volume: 22_000, difficulty: 0.35 },
  { keyword: 'mudik gratis 2026', position: 4, volume: 14_800, difficulty: 0.65 },
  { keyword: 'mudik motor honda', position: 2, volume: 9_900, difficulty: 0.42 },
  { keyword: 'daftar mudik honda 2026', position: 1, volume: 8_100, difficulty: 0.28 },
  { keyword: 'program mudik astra honda', position: 1, volume: 5_400, difficulty: 0.22 },
  { keyword: 'biaya mudik bareng honda 2026', position: 3, volume: 6_600, difficulty: 0.48 },
  { keyword: 'syarat mudik bareng honda', position: 5, volume: 4_200, difficulty: 0.38 },
  { keyword: 'rute mudik honda 2026', position: 2, volume: 3_800, difficulty: 0.32 },
  { keyword: 'jadwal mudik bareng honda', position: 3, volume: 7_200, difficulty: 0.45 },
  { keyword: 'tips mudik motor aman', position: 8, volume: 12_000, difficulty: 0.72 },
];

export const MBBH_SEO_PAGES = [
  { url: 'https://www.astra-honda.com/mudik-bareng-honda', score: 92, loadTimeMs: 1_200, mobileScore: 88 },
  { url: 'https://www.astra-honda.com/mbbh-registrasi', score: 88, loadTimeMs: 1_800, mobileScore: 82 },
  { url: 'https://www.astra-honda.com/mbbh-rute', score: 85, loadTimeMs: 2_100, mobileScore: 79 },
  { url: 'https://www.astra-honda.com/mbbh-faq', score: 78, loadTimeMs: 2_500, mobileScore: 72 },
  { url: 'https://www.astra-honda.com/mbbh-tips-mudik', score: 82, loadTimeMs: 1_900, mobileScore: 85 },
];

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  google_search: 'Google Search (SEM)',
  google_discovery: 'Google Discovery',
  social_tiktok: 'TikTok Ads',
  social_instagram: 'Instagram Ads',
  social_facebook: 'Facebook Ads',
};
