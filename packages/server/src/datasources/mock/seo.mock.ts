import type { SEORanking, SEOPageAudit } from '@marketpulse/shared';
import { MBBH_SEO_KEYWORDS, MBBH_SEO_PAGES } from '@marketpulse/shared';
import type { ISEOProvider, BacklinkData, TechnicalIssue } from '../interfaces.js';

export class MockSEOProvider implements ISEOProvider {
  async getRankings(_campaignId: number, startDate: string, endDate: string): Promise<SEORanking[]> {
    const days = this.getDays(startDate, endDate);
    const rankings: SEORanking[] = [];

    for (const day of days) {
      for (const kw of MBBH_SEO_KEYWORDS) {
        const posChange = Math.round((Math.random() - 0.45) * 3); // Slight positive trend
        const currentPos = Math.max(1, kw.position + posChange);
        rankings.push({
          id: rankings.length + 1,
          tenantId: 1,
          campaignId: 1,
          keyword: kw.keyword,
          url: MBBH_SEO_PAGES[0].url,
          position: currentPos,
          previousPosition: kw.position,
          searchVolume: kw.volume,
          difficulty: kw.difficulty,
          metricDate: day,
        });
      }
    }

    return rankings;
  }

  async getPageAudits(_campaignId: number): Promise<SEOPageAudit[]> {
    return MBBH_SEO_PAGES.map((page, i) => ({
      id: i + 1,
      tenantId: 1,
      campaignId: 1,
      url: page.url,
      pageScore: page.score,
      loadTimeMs: page.loadTimeMs,
      mobileScore: page.mobileScore,
      issues: this.generateIssues(page.score),
      auditDate: new Date().toISOString().split('T')[0],
    }));
  }

  async getBacklinks(_campaignId: number): Promise<BacklinkData[]> {
    return [
      { sourceUrl: 'https://otomotif.kompas.com/read/mudik-honda', targetUrl: 'https://www.astra-honda.com/mudik-bareng-honda', anchorText: 'mudik bareng honda 2026', domainAuthority: 88, isNew: true, firstSeen: '2026-02-10' },
      { sourceUrl: 'https://www.detik.com/oto/honda-mudik', targetUrl: 'https://www.astra-honda.com/mudik-bareng-honda', anchorText: 'program mudik honda', domainAuthority: 92, isNew: true, firstSeen: '2026-02-08' },
      { sourceUrl: 'https://www.tempo.co/otomotif/mudik-honda', targetUrl: 'https://www.astra-honda.com/mbbh-registrasi', anchorText: 'daftar mudik honda', domainAuthority: 85, isNew: false, firstSeen: '2026-01-25' },
      { sourceUrl: 'https://gridoto.com/mudik-aman-honda', targetUrl: 'https://www.astra-honda.com/mbbh-tips-mudik', anchorText: 'tips mudik motor aman', domainAuthority: 78, isNew: false, firstSeen: '2026-02-01' },
      { sourceUrl: 'https://kumparan.com/otomotif/honda-mbbh', targetUrl: 'https://www.astra-honda.com/mudik-bareng-honda', anchorText: 'Honda MBBH 2026', domainAuthority: 82, isNew: true, firstSeen: '2026-02-12' },
    ];
  }

  async getTechnicalIssues(_campaignId: number): Promise<TechnicalIssue[]> {
    return [
      { type: 'page_speed', severity: 'medium', url: 'https://www.astra-honda.com/mbbh-faq', description: 'Page load time 2.5s (target: <2s)', howToFix: 'Optimize images, enable lazy loading, minify CSS/JS' },
      { type: 'mobile_usability', severity: 'low', url: 'https://www.astra-honda.com/mbbh-rute', description: 'Touch targets too close together on mobile', howToFix: 'Increase button spacing to minimum 48px' },
      { type: 'meta_tags', severity: 'high', url: 'https://www.astra-honda.com/mbbh-faq', description: 'Meta description too short (45 chars, recommended: 120-160)', howToFix: 'Write descriptive meta description with target keyword' },
      { type: 'structured_data', severity: 'medium', url: 'https://www.astra-honda.com/mbbh-registrasi', description: 'Missing FAQ schema markup', howToFix: 'Add JSON-LD FAQ structured data for registration questions' },
    ];
  }

  private generateIssues(score: number): SEOPageAudit['issues'] {
    const issues: SEOPageAudit['issues'] = [];
    if (score < 90) issues.push({ type: 'performance', severity: 'medium', description: 'Page load time above 2 seconds' });
    if (score < 85) issues.push({ type: 'seo', severity: 'low', description: 'Missing alt text on 2 images' });
    if (score < 80) issues.push({ type: 'accessibility', severity: 'high', description: 'Low contrast ratio on CTA button' });
    return issues;
  }

  private getDays(start: string, end: string): string[] {
    const days: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return days;
  }
}
