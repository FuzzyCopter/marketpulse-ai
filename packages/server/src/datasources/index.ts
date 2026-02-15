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

// Singleton instances
let searchAds: ISearchAdsProvider | null = null;
let discoveryAds: IDiscoveryAdsProvider | null = null;
let socialMedia: ISocialMediaProvider | null = null;
let seo: ISEOProvider | null = null;

const isLive = () => env.dataSourceMode === 'live';

export function getSearchAdsProvider(): ISearchAdsProvider {
  if (!searchAds) {
    if (isLive() && env.google.adsDeveloperToken) {
      // Google Ads API requires developer token — not available yet
      // Future: import LiveSearchAdsProvider
      console.warn('[DataSource] Google Ads developer token set but live provider not yet implemented. Using mock.');
    }
    searchAds = new MockSearchAdsProvider();
  }
  return searchAds;
}

export function getDiscoveryAdsProvider(): IDiscoveryAdsProvider {
  if (!discoveryAds) {
    // Discovery Ads uses same Google Ads API — needs developer token
    discoveryAds = new MockDiscoveryAdsProvider();
  }
  return discoveryAds;
}

export function getSocialMediaProvider(): ISocialMediaProvider {
  if (!socialMedia) {
    // Social media needs Meta/TikTok API tokens
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
      if (isLive()) {
        console.warn('[DataSource] SEO: Live mode requested but Google credentials missing. Using mock.');
      }
    }
  }
  return seo;
}

export function getDataSourceMode(): 'mock' | 'live' {
  return env.dataSourceMode;
}
