import { useEffect, useState } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import api from '../services/api';
import type { SEMKeyword } from '@marketpulse/shared';
import { ArrowUpDown } from 'lucide-react';

interface BidSuggestion {
  keywordId: number;
  keyword: string;
  currentCpc: number;
  suggestedCpc: number;
  reason: string;
  expectedImpact: string;
}

export default function SEMPage() {
  const { activeCampaignId } = useCampaignStore();
  const [keywords, setKeywords] = useState<SEMKeyword[]>([]);
  const [suggestions, setSuggestions] = useState<BidSuggestion[]>([]);
  const [sortBy, setSortBy] = useState<'qualityScore' | 'keyword'>('qualityScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function load() {
      const [kwRes, sugRes] = await Promise.all([
        api.get(`/sem/campaigns/${activeCampaignId}/keywords`),
        api.get(`/sem/campaigns/${activeCampaignId}/bid-suggestions`),
      ]);
      setKeywords(kwRes.data.keywords);
      setSuggestions(sugRes.data.suggestions);
    }
    load();
  }, [activeCampaignId]);

  const sorted = [...keywords].sort((a, b) => {
    const aVal = sortBy === 'qualityScore' ? (a.qualityScore || 0) : a.keyword;
    const bVal = sortBy === 'qualityScore' ? (b.qualityScore || 0) : b.keyword;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const toggleSort = (col: 'qualityScore' | 'keyword') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">SEM - Google Search Ads</h1>

      {/* Keywords Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" data-tour="sem-keywords">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Keywords ({keywords.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => toggleSort('keyword')}>
                  <span className="flex items-center gap-1">Keyword <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">Match Type</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">Status</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">Max CPC</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => toggleSort('qualityScore')}>
                  <span className="flex items-center justify-center gap-1">QS <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Ad Group</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((kw) => (
                <tr key={kw.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-800">{kw.keyword}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      kw.matchType === 'exact' ? 'bg-blue-100 text-blue-700' :
                      kw.matchType === 'phrase' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {kw.matchType}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1" />
                    {kw.status}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-600">Rp {(kw.maxCpc || 0).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      (kw.qualityScore || 0) >= 8 ? 'bg-green-100 text-green-700' :
                      (kw.qualityScore || 0) >= 6 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {kw.qualityScore}/10
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-500 text-sm">{kw.adGroup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Bid Suggestions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Bid Suggestions</h3>
        <div className="space-y-3">
          {suggestions.map((s) => (
            <div key={s.keywordId} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{s.keyword}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Rp {s.currentCpc.toLocaleString('id-ID')}</span>
                  <span className="text-gray-400">→</span>
                  <span className={`text-sm font-medium ${s.suggestedCpc > s.currentCpc ? 'text-green-600' : 'text-blue-600'}`}>
                    Rp {s.suggestedCpc.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">{s.reason}</p>
              <p className="text-xs text-blue-600 mt-1">{s.expectedImpact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
