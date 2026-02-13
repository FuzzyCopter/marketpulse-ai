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

// Singleton instances
let searchAds: ISearchAdsProvider | null = null;
let discoveryAds: IDiscoveryAdsProvider | null = null;
let socialMedia: ISocialMediaProvider | null = null;
let seo: ISEOProvider | null = null;

export function getSearchAdsProvider(): ISearchAdsProvider {
  if (!searchAds) {
    if (env.dataSourceMode === 'live') {
      // Future: import and instantiate LiveSearchAdsProvider
      throw new Error('Live Google Search Ads provider not yet implemented. Set DATA_SOURCE_MODE=mock');
    }
    searchAds = new MockSearchAdsProvider();
  }
  return searchAds;
}

export function getDiscoveryAdsProvider(): IDiscoveryAdsProvider {
  if (!discoveryAds) {
    if (env.dataSourceMode === 'live') {
      throw new Error('Live Google Discovery provider not yet implemented. Set DATA_SOURCE_MODE=mock');
    }
    discoveryAds = new MockDiscoveryAdsProvider();
  }
  return discoveryAds;
}

export function getSocialMediaProvider(): ISocialMediaProvider {
  if (!socialMedia) {
    if (env.dataSourceMode === 'live') {
      throw new Error('Live Social Media provider not yet implemented. Set DATA_SOURCE_MODE=mock');
    }
    socialMedia = new MockSocialMediaProvider();
  }
  return socialMedia;
}

export function getSEOProvider(): ISEOProvider {
  if (!seo) {
    if (env.dataSourceMode === 'live') {
      throw new Error('Live SEO provider not yet implemented. Set DATA_SOURCE_MODE=mock');
    }
    seo = new MockSEOProvider();
  }
  return seo;
}

export function getDataSourceMode(): 'mock' | 'live' {
  return env.dataSourceMode;
}
