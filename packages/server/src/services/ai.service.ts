import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import type { DashboardOverview, SEMKeyword, SEORanking } from '@marketpulse/shared';

interface AIAnalysisInput {
  campaign: {
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    daysElapsed: number;
    totalDays: number;
  };
  kpiProgress: Array<{
    channel: string;
    metric: string;
    current: number;
    target: number;
    progressPercent: number;
    projectedTotal: number;
    onTrack: boolean;
  }>;
  keywords?: SEMKeyword[];
  rankings?: SEORanking[];
}

interface AIInsightResult {
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical' | 'positive';
  insightType: 'performance_summary' | 'anomaly' | 'recommendation' | 'trend';
  actions?: Array<{
    actionType: string;
    target: string;
    suggestion: string;
    expectedImpact: string;
  }>;
}

// Cache for AI responses (avoid spamming API)
const insightCache = new Map<string, { data: AIInsightResult[]; expiresAt: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function getCacheKey(campaignId: number, type: string): string {
  const dateKey = new Date().toISOString().split('T')[0];
  return `${campaignId}:${type}:${dateKey}`;
}

// === Claude AI Integration ===
async function analyzeWithClaude(input: AIAnalysisInput, promptType: string): Promise<AIInsightResult[]> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });

  const systemPrompt = `Kamu adalah AI analyst untuk digital marketing agency bernama Manna Digital.
Kamu menganalisa campaign performance untuk Honda Indonesia.
Berikan insight dalam bahasa Indonesia yang actionable dan spesifik.
Format response sebagai JSON array dari insight objects.`;

  let userPrompt = '';

  if (promptType === 'performance') {
    userPrompt = `Analisa performance campaign berikut:

Campaign: ${input.campaign.name}
Periode: ${input.campaign.startDate} - ${input.campaign.endDate}
Status: ${input.campaign.status}
Progress: Hari ke-${input.campaign.daysElapsed} dari ${input.campaign.totalDays} hari

KPI Progress:
${input.kpiProgress.map(k =>
  `- ${k.channel}: ${k.current.toLocaleString()} / ${k.target.toLocaleString()} ${k.metric} (${k.progressPercent}%) ${k.onTrack ? '✅ On Track' : '⚠️ Behind'}`
).join('\n')}

${input.keywords ? `\nTop SEM Keywords:\n${input.keywords.slice(0, 10).map(k =>
  `- "${k.keyword}" QS:${k.qualityScore} CPC:Rp${k.avgCpc} Match:${k.matchType}`
).join('\n')}` : ''}

Berikan 3-5 insights dalam format JSON array:
[{
  "title": "judul singkat",
  "content": "penjelasan detail dan rekomendasi actionable",
  "severity": "info|warning|critical|positive",
  "insightType": "performance_summary|anomaly|recommendation|trend",
  "actions": [{"actionType": "adjust_bid|pause_keyword|adjust_budget", "target": "entity name", "suggestion": "apa yang harus dilakukan", "expectedImpact": "expected result"}]
}]`;
  } else if (promptType === 'optimize') {
    userPrompt = `Sebagai AI optimizer, analisa data SEM campaign berikut dan berikan rekomendasi optimasi:

Campaign: ${input.campaign.name}
Budget progress: Hari ke-${input.campaign.daysElapsed}/${input.campaign.totalDays}

KPI Status:
${input.kpiProgress.map(k =>
  `- ${k.channel}: ${k.progressPercent}% dari target (projected: ${k.projectedTotal.toLocaleString()})`
).join('\n')}

Keywords:
${(input.keywords || []).map(k =>
  `- "${k.keyword}" QS:${k.qualityScore} CPC:Rp${k.avgCpc} Status:${k.status} Match:${k.matchType}`
).join('\n')}

Berikan rekomendasi optimasi spesifik dalam format JSON array:
[{
  "title": "judul rekomendasi",
  "content": "penjelasan detail kenapa dan bagaimana",
  "severity": "info|warning|critical|positive",
  "insightType": "recommendation",
  "actions": [{"actionType": "adjust_bid|pause_keyword|enable_keyword|adjust_budget", "target": "keyword atau campaign name", "suggestion": "action spesifik (e.g. turunkan bid 15%)", "expectedImpact": "estimasi dampak"}]
}]`;
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [{
      title: 'AI Analysis Complete',
      content: text,
      severity: 'info',
      insightType: 'performance_summary',
    }];
  }

  return JSON.parse(jsonMatch[0]);
}

// === Mock AI (when no API key) ===
function generateMockInsights(input: AIAnalysisInput, promptType: string): AIInsightResult[] {
  const insights: AIInsightResult[] = [];
  const { kpiProgress, campaign } = input;

  // Performance summary
  const behindTargets = kpiProgress.filter(k => !k.onTrack);
  const aheadTargets = kpiProgress.filter(k => k.onTrack);

  if (promptType === 'performance' || promptType === 'optimize') {
    // Overall status
    if (behindTargets.length === 0) {
      insights.push({
        title: 'Semua KPI On Track',
        content: `Campaign ${campaign.name} berjalan baik. Semua ${kpiProgress.length} channel memenuhi target pace. Projected total sesuai dengan brief Honda. Pertahankan strategi saat ini.`,
        severity: 'positive',
        insightType: 'performance_summary',
      });
    } else {
      insights.push({
        title: `${behindTargets.length} Channel di Bawah Target`,
        content: `${behindTargets.map(b => b.channel).join(', ')} sedang di bawah target pace. ${behindTargets.map(b => `${b.channel}: ${b.progressPercent}% (projected ${b.projectedTotal.toLocaleString()} vs target ${b.target.toLocaleString()})`).join('. ')}. Perlu optimasi segera.`,
        severity: behindTargets.length > 1 ? 'critical' : 'warning',
        insightType: 'anomaly',
        actions: behindTargets.map(b => ({
          actionType: 'adjust_budget',
          target: b.channel,
          suggestion: `Naikkan daily budget ${b.channel} sebesar 20%`,
          expectedImpact: `Estimasi +${Math.round(b.target * 0.05).toLocaleString()} ${b.metric} tambahan`,
        })),
      });
    }

    // SEM keyword analysis
    if (input.keywords && input.keywords.length > 0) {
      const lowQS = input.keywords.filter(k => (k.qualityScore || 0) < 7);
      const highCPC = input.keywords.filter(k => k.avgCpc > 1500);

      if (lowQS.length > 0) {
        insights.push({
          title: `${lowQS.length} Keyword Quality Score Rendah`,
          content: `Keyword berikut punya QS di bawah 7: ${lowQS.map(k => `"${k.keyword}" (QS:${k.qualityScore})`).join(', ')}. Perbaiki ad relevance dan landing page experience untuk menurunkan CPC.`,
          severity: 'warning',
          insightType: 'recommendation',
          actions: lowQS.map(k => ({
            actionType: 'adjust_bid',
            target: k.keyword,
            suggestion: `Turunkan bid "${k.keyword}" 10-15% sambil perbaiki ad copy`,
            expectedImpact: 'CPC turun ~15%, budget lebih efisien',
          })),
        });
      }

      if (highCPC.length > 0) {
        insights.push({
          title: `${highCPC.length} Keyword CPC Tinggi`,
          content: `Keyword dengan CPC di atas Rp 1.500: ${highCPC.map(k => `"${k.keyword}" (Rp${k.avgCpc.toLocaleString()})`).join(', ')}. Pertimbangkan untuk menurunkan bid atau pakai match type yang lebih specific.`,
          severity: 'info',
          insightType: 'recommendation',
          actions: highCPC.map(k => ({
            actionType: 'adjust_bid',
            target: k.keyword,
            suggestion: `Ubah match type "${k.keyword}" ke phrase/exact untuk CPC lebih rendah`,
            expectedImpact: 'CPC turun ~20%, lebih targeted',
          })),
        });
      }
    }

    // Budget pacing
    const progressRatio = campaign.daysElapsed / campaign.totalDays;
    if (progressRatio > 0) {
      const avgProgressPct = kpiProgress.reduce((sum, k) => sum + k.progressPercent, 0) / kpiProgress.length;
      const expectedProgressPct = progressRatio * 100;

      if (avgProgressPct > expectedProgressPct + 15) {
        insights.push({
          title: 'Budget Pacing Terlalu Cepat',
          content: `Campaign sudah mencapai ${Math.round(avgProgressPct)}% dari target di hari ke-${campaign.daysElapsed} (expected: ${Math.round(expectedProgressPct)}%). Kalau pace ini terus, budget bisa habis sebelum campaign selesai. Pertimbangkan turunkan daily budget 15%.`,
          severity: 'warning',
          insightType: 'trend',
          actions: [{
            actionType: 'adjust_budget',
            target: campaign.name,
            suggestion: 'Turunkan daily budget 15% untuk meratakan distribusi',
            expectedImpact: 'Budget tersebar merata sampai akhir campaign',
          }],
        });
      } else if (avgProgressPct < expectedProgressPct - 15) {
        insights.push({
          title: 'Budget Pacing Terlalu Lambat',
          content: `Campaign baru mencapai ${Math.round(avgProgressPct)}% di hari ke-${campaign.daysElapsed} (expected: ${Math.round(expectedProgressPct)}%). Perlu akselerasi untuk mencapai target brief Honda. Naikkan daily budget atau expand keyword targeting.`,
          severity: 'warning',
          insightType: 'trend',
          actions: [{
            actionType: 'adjust_budget',
            target: campaign.name,
            suggestion: 'Naikkan daily budget 25% dan tambah broad match keywords',
            expectedImpact: 'Estimasi kejar target dalam 3-5 hari',
          }],
        });
      }
    }

    // Day-of-week insight
    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      insights.push({
        title: 'Weekend Traffic Pattern',
        content: 'Hari weekend biasanya traffic 20-25% lebih rendah dari weekday. Ini normal untuk B2C automotive campaign. CPC juga cenderung lebih murah di weekend — bisa manfaatkan untuk push keyword broad match.',
        severity: 'info',
        insightType: 'trend',
      });
    }
  }

  return insights;
}

// === Public API ===

export async function getAIInsights(
  campaignId: number,
  analysisInput: AIAnalysisInput,
  type: 'performance' | 'optimize' = 'performance'
): Promise<AIInsightResult[]> {
  const cacheKey = getCacheKey(campaignId, type);
  const cached = insightCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let insights: AIInsightResult[];

  if (env.anthropicApiKey) {
    try {
      insights = await analyzeWithClaude(analysisInput, type);
    } catch (error) {
      console.error('Claude API error, falling back to mock:', error);
      insights = generateMockInsights(analysisInput, type);
    }
  } else {
    insights = generateMockInsights(analysisInput, type);
  }

  insightCache.set(cacheKey, { data: insights, expiresAt: Date.now() + CACHE_TTL });
  return insights;
}

export function clearInsightCache(campaignId?: number): void {
  if (campaignId) {
    for (const key of insightCache.keys()) {
      if (key.startsWith(`${campaignId}:`)) {
        insightCache.delete(key);
      }
    }
  } else {
    insightCache.clear();
  }
}
