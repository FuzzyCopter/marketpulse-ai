import { useEffect, useState } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import api from '../services/api';
import { ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';

interface RankingRow {
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  difficulty: number;
}

interface PageAudit {
  url: string;
  pageScore: number;
  loadTimeMs: number;
  mobileScore: number;
  issues: { type: string; severity: string; description: string }[];
}

interface TechnicalIssue {
  type: string;
  severity: string;
  url: string;
  description: string;
  howToFix: string;
}

export default function SEOPage() {
  const { activeCampaignId } = useCampaignStore();
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [pages, setPages] = useState<PageAudit[]>([]);
  const [issues, setIssues] = useState<TechnicalIssue[]>([]);

  useEffect(() => {
    async function load() {
      const [rankRes, pageRes, issueRes] = await Promise.all([
        api.get(`/seo/campaigns/${activeCampaignId}/rankings`),
        api.get(`/seo/campaigns/${activeCampaignId}/pages`),
        api.get(`/seo/campaigns/${activeCampaignId}/technical`),
      ]);

      // Deduplicate rankings by keyword (take latest)
      const kwMap = new Map<string, RankingRow>();
      for (const r of rankRes.data.rankings) {
        kwMap.set(r.keyword, r);
      }
      setRankings(Array.from(kwMap.values()));
      setPages(pageRes.data.pages);
      setIssues(issueRes.data.issues);
    }
    load();
  }, [activeCampaignId]);

  const PositionChange = ({ current, previous }: { current: number; previous: number }) => {
    const diff = previous - current;
    if (diff > 0) return <span className="flex items-center text-green-600 text-xs"><ArrowUp size={12} /> {diff}</span>;
    if (diff < 0) return <span className="flex items-center text-red-500 text-xs"><ArrowDown size={12} /> {Math.abs(diff)}</span>;
    return <span className="text-gray-400"><Minus size={12} /></span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">SEO - Organic Rankings</h1>

      {/* Rankings Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5" data-tour="seo-rankings">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Keyword Rankings</h3>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-500 font-medium">Keyword</th>
              <th className="text-center py-3 px-2 text-gray-500 font-medium">Position</th>
              <th className="text-center py-3 px-2 text-gray-500 font-medium">Change</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Volume</th>
              <th className="text-center py-3 px-2 text-gray-500 font-medium">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r) => (
              <tr key={r.keyword} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium text-gray-800">{r.keyword}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    r.position <= 3 ? 'bg-green-100 text-green-700' :
                    r.position <= 10 ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    #{r.position}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <PositionChange current={r.position} previous={r.previousPosition} />
                </td>
                <td className="py-3 px-2 text-right text-gray-600">{(r.searchVolume || 0).toLocaleString('id-ID')}</td>
                <td className="py-3 px-2 text-center">
                  <div className="w-full bg-gray-100 rounded-full h-2 max-w-16 mx-auto">
                    <div
                      className={`h-2 rounded-full ${
                        (r.difficulty || 0) > 0.6 ? 'bg-red-500' : (r.difficulty || 0) > 0.4 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(r.difficulty || 0) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Page Audits */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Page Audits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((p) => (
            <div key={p.url} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate">
                  {p.url.replace('https://www.astra-honda.com/', '/')}
                  <ExternalLink size={12} />
                </a>
                <span className={`text-lg font-bold ${p.pageScore >= 90 ? 'text-green-600' : p.pageScore >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                  {p.pageScore}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>Load: {p.loadTimeMs}ms</span>
                <span>Mobile: {p.mobileScore}/100</span>
              </div>
              {p.issues.length > 0 && (
                <div className="mt-2 space-y-1">
                  {p.issues.map((issue, i) => (
                    <div key={i} className={`text-xs px-2 py-1 rounded ${
                      issue.severity === 'high' ? 'bg-red-50 text-red-600' :
                      issue.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {issue.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Technical Issues */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Issues ({issues.length})</h3>
        <div className="space-y-3">
          {issues.map((issue, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                  issue.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {issue.severity}
                </span>
                <span className="text-xs text-gray-400">{issue.type}</span>
              </div>
              <p className="text-sm text-gray-800 mb-1">{issue.description}</p>
              <p className="text-xs text-gray-500">URL: {issue.url}</p>
              <p className="text-xs text-blue-600 mt-1">Fix: {issue.howToFix}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
