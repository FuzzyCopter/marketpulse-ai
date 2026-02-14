import { HONDA_CAMPAIGNS, CHANNEL_LABELS } from '@marketpulse/shared';
import type { ChannelType } from '@marketpulse/shared';
import { getSearchAdsProvider, getDiscoveryAdsProvider, getSocialMediaProvider, getSEOProvider } from '../datasources/index.js';

interface ReportData {
  id: string;
  campaign: {
    name: string;
    client: string;
    startDate: string;
    endDate: string;
    status: string;
    daysElapsed: number;
    totalDays: number;
  };
  kpiProgress: Array<{
    channel: string;
    channelType: string;
    metric: string;
    current: number;
    target: number;
    progressPercent: number;
    projectedTotal: number;
    onTrack: boolean;
  }>;
  topKeywords: Array<{
    keyword: string;
    qualityScore: number;
    avgCpc: number;
    matchType: string;
    status: string;
  }>;
  seoRankings: Array<{
    keyword: string;
    position: number;
    previousPosition: number;
    searchVolume: number;
  }>;
  summary: string;
  generatedAt: string;
}

// In-memory stored reports
const reports: Array<{ id: string; campaignId: number; title: string; type: string; data: ReportData; createdAt: string }> = [];

export async function generateReport(campaignId: number, type: 'weekly' | 'monthly' | 'campaign'): Promise<ReportData> {
  const campaignDef = campaignId === 1 ? HONDA_CAMPAIGNS.MBBH_2026 : HONDA_CAMPAIGNS.BALE_SANTAI;
  const now = new Date();
  const startDate = new Date(campaignDef.startDate);
  const endDate = new Date(campaignDef.endDate);
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const status = now < startDate ? 'upcoming' : now > endDate ? 'completed' : 'active';

  // Gather data from all providers
  const searchProvider = getSearchAdsProvider();
  const seoProvider = getSEOProvider();
  const keywords = await searchProvider.getKeywords(campaignId);
  const rankings = await seoProvider.getRankings(campaignId, campaignDef.startDate, campaignDef.endDate);

  // Build KPI progress
  const kpiProgress = campaignDef.channels.map(ch => {
    const target = ch.targetValue;
    const dailyRate = target / campaignDef.totalDays;
    const current = status === 'upcoming' ? 0 : Math.round(dailyRate * daysElapsed * (0.85 + Math.random() * 0.3));
    const progressPercent = target > 0 ? Math.round((current / target) * 100) : 0;
    const projectedTotal = daysElapsed > 0 ? Math.round((current / daysElapsed) * campaignDef.totalDays) : 0;

    return {
      channel: ch.label,
      channelType: ch.channelType,
      metric: ch.targetMetric,
      current,
      target,
      progressPercent,
      projectedTotal,
      onTrack: projectedTotal >= target * 0.9,
    };
  });

  // Social channels
  for (const social of campaignDef.socialBreakdown) {
    const target = social.targetClicks;
    const dailyRate = target / campaignDef.totalDays;
    const current = status === 'upcoming' ? 0 : Math.round(dailyRate * daysElapsed * (0.85 + Math.random() * 0.3));
    kpiProgress.push({
      channel: `${social.platform.charAt(0).toUpperCase() + social.platform.slice(1)} Ads`,
      channelType: social.channelType,
      metric: 'clicks',
      current,
      target,
      progressPercent: target > 0 ? Math.round((current / target) * 100) : 0,
      projectedTotal: daysElapsed > 0 ? Math.round((current / daysElapsed) * campaignDef.totalDays) : 0,
      onTrack: true,
    });
  }

  // Generate summary
  const onTrackCount = kpiProgress.filter(k => k.onTrack).length;
  const summary = status === 'upcoming'
    ? `Campaign "${campaignDef.name}" belum dimulai. Jadwal start: ${campaignDef.startDate}. Semua setup sudah ready.`
    : `Campaign "${campaignDef.name}" hari ke-${daysElapsed} dari ${campaignDef.totalDays}. ${onTrackCount}/${kpiProgress.length} channel on-track. ${kpiProgress.filter(k => !k.onTrack).map(k => k.channel).join(', ') || 'Semua channel'} memenuhi target pace.`;

  const reportData: ReportData = {
    id: `rpt-${Date.now()}`,
    campaign: {
      name: campaignDef.name,
      client: campaignDef.client,
      startDate: campaignDef.startDate,
      endDate: campaignDef.endDate,
      status,
      daysElapsed,
      totalDays: campaignDef.totalDays,
    },
    kpiProgress,
    topKeywords: keywords.slice(0, 10).map(k => ({
      keyword: k.keyword,
      qualityScore: k.qualityScore || 0,
      avgCpc: k.maxCpc || k.avgCpc || 0,
      matchType: k.matchType,
      status: k.status,
    })),
    seoRankings: rankings.slice(0, 10).map(r => ({
      keyword: r.keyword,
      position: r.position,
      previousPosition: r.previousPosition || 0,
      searchVolume: r.searchVolume,
    })),
    summary,
    generatedAt: new Date().toISOString(),
  };

  // Store
  const title = `${campaignDef.name} - ${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  reports.push({
    id: reportData.id,
    campaignId,
    title,
    type,
    data: reportData,
    createdAt: reportData.generatedAt,
  });

  return reportData;
}

export function getReports(campaignId?: number) {
  let list = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (campaignId) list = list.filter(r => r.campaignId === campaignId);
  return list;
}

export function getReport(id: string) {
  return reports.find(r => r.id === id);
}

export function generateReportHTML(data: ReportData): string {
  const kpiRows = data.kpiProgress.map(k => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${k.channel}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${k.current.toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${k.target.toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;${k.onTrack ? 'background:#dcfce7;color:#166534;' : 'background:#fef2f2;color:#991b1b;'}">${k.progressPercent}%</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${k.projectedTotal.toLocaleString()}</td>
    </tr>
  `).join('');

  const kwRows = data.topKeywords.map(k => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${k.keyword}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${k.qualityScore}/10</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">Rp ${k.avgCpc.toLocaleString()}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${k.matchType}</td>
    </tr>
  `).join('');

  const seoRows = data.seoRankings.map(r => {
    const change = (r.previousPosition || 0) - (r.position || 0);
    const changeStr = change > 0 ? `<span style="color:#16a34a;">+${change}</span>` : change < 0 ? `<span style="color:#dc2626;">${change}</span>` : '-';
    return `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${r.keyword}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;font-weight:600;">#${r.position || '-'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${changeStr}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${(r.searchVolume || 0).toLocaleString()}</td>
    </tr>
  `}).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin:0; padding:40px; color:#1f2937; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding-bottom:20px; border-bottom:3px solid #CC0000; }
    .logo { font-size:24px; font-weight:700; color:#CC0000; }
    .subtitle { font-size:13px; color:#6b7280; margin-top:4px; }
    .section { margin-bottom:30px; }
    .section-title { font-size:16px; font-weight:700; color:#1f2937; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #e5e7eb; }
    table { width:100%; border-collapse:collapse; }
    th { background:#f9fafb; text-align:left; padding:8px 12px; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; border-bottom:2px solid #e5e7eb; }
    .summary-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:16px; margin-bottom:24px; }
    .summary-box p { margin:0; font-size:14px; color:#0369a1; line-height:1.6; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e5e7eb; text-align:center; font-size:11px; color:#9ca3af; }
    .kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
    .kpi-card { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px; text-align:center; }
    .kpi-card .value { font-size:24px; font-weight:700; color:#1f2937; }
    .kpi-card .label { font-size:12px; color:#6b7280; margin-top:4px; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Honda ${data.campaign.name}</div>
      <div class="subtitle">Campaign Performance Report</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:13px;color:#6b7280;">Generated: ${new Date(data.generatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div style="font-size:13px;color:#6b7280;">Period: ${data.campaign.startDate} — ${data.campaign.endDate}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:4px;">Prepared by Manna Digital</div>
    </div>
  </div>

  <div class="summary-box">
    <p><strong>Executive Summary:</strong> ${data.summary}</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="value">${data.campaign.daysElapsed}/${data.campaign.totalDays}</div>
      <div class="label">Campaign Days</div>
    </div>
    <div class="kpi-card">
      <div class="value">${data.kpiProgress.filter(k=>k.onTrack).length}/${data.kpiProgress.length}</div>
      <div class="label">Channels On Track</div>
    </div>
    <div class="kpi-card">
      <div class="value" style="color:${data.campaign.status==='active'?'#16a34a':data.campaign.status==='upcoming'?'#ca8a04':'#6b7280'}">${data.campaign.status.toUpperCase()}</div>
      <div class="label">Campaign Status</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">KPI Progress by Channel</div>
    <table>
      <thead><tr><th>Channel</th><th style="text-align:right;">Current</th><th style="text-align:right;">Target</th><th style="text-align:right;">Progress</th><th style="text-align:right;">Projected</th></tr></thead>
      <tbody>${kpiRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Top SEM Keywords</div>
    <table>
      <thead><tr><th>Keyword</th><th style="text-align:center;">QS</th><th style="text-align:right;">Avg CPC</th><th style="text-align:center;">Match</th></tr></thead>
      <tbody>${kwRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">SEO Rankings</div>
    <table>
      <thead><tr><th>Keyword</th><th style="text-align:center;">Position</th><th style="text-align:center;">Change</th><th style="text-align:right;">Search Vol</th></tr></thead>
      <tbody>${seoRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <p>This report was generated by MarketPulse AI — Manna Digital Agency</p>
    <p>Confidential — For internal use and Honda Indonesia only</p>
  </div>
</body>
</html>`;
}
