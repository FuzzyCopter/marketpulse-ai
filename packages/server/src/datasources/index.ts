import { env } from '../config/env.js';
import type {
  ISearchAdsProvider,
  IDiscoveryAdsProvider,
  ISocialMediaProvider,
  ISEOProvider,
} from './interfaces.js';
import { MockSearchAdsProvider } from './mock/google-search.mock.js';
import { MockDiscoveryAdsProvider } from './mock/google-discovery.mock.js';
import { MockSocialMediaProvider } from './mock/social-media.mock.js';
import { MockSEOProvider } from './mock/seo.mock.js';
import { LiveSEOProvider } from './live/seo.live.js';
import { LiveSearchAdsProvider, LiveDiscoveryAdsProvider } from './live/google-ads.live.js';

// Singleton instances
let searchAds: ISearchAdsProvider | null = null;
let discoveryAds: IDiscoveryAdsProvider | null = null;
let socialMedia: ISocialMediaProvider | null = null;
let seo: ISEOProvider | null = null;

const isLive = () => env.dataSourceMode === 'live';
const hasGoogleAds = () => env.google.adsDeveloperToken && env.google.adsCustomerId && env.google.refreshToken;

export function getSearchAdsProvider(): ISearchAdsProvider {
  if (!searchAds) {
    if (isLive() && hasGoogleAds()) {
      searchAds = new LiveSearchAdsProvider();
      console.log('[DataSource] Search Ads: Using LIVE Google Ads provider');
    } else {
      searchAds = new MockSearchAdsProvider();
    }
  }
  return searchAds;
}

export function getDiscoveryAdsProvider(): IDiscoveryAdsProvider {
  if (!discoveryAds) {
    if (isLive() && hasGoogleAds()) {
      discoveryAds = new LiveDiscoveryAdsProvider();
      console.log('[DataSource] Discovery Ads: Using LIVE Google Ads provider');
    } else {
      discoveryAds = new MockDiscoveryAdsProvider();
    }
  }
  return discoveryAds;
}

export function getSocialMediaProvider(): ISocialMediaProvider {
  if (!socialMedia) {
    // Social media needs Meta/TikTok API tokens — mock for now
    socialMedia = new MockSocialMediaProvider();
  }
  return socialMedia;
}

export function getSEOProvider(): ISEOProvider {
  if (!seo) {
    if (isLive() && env.google.refreshToken) {
      seo = new LiveSEOProvider();
      console.log('[DataSource] SEO: Using LIVE Search Console provider');
    } else {
      seo = new MockSEOProvider();
    }
  }
  return seo;
}

export function getDataSourceMode(): 'mock' | 'live' {
  return env.dataSourceMode;
}
