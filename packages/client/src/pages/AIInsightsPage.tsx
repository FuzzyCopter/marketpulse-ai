import { useEffect, useState } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import api from '../services/api';
import { Brain, AlertTriangle, TrendingUp, CheckCircle, Info, RefreshCw, Zap } from 'lucide-react';

interface AIAction {
  actionType: string;
  target: string;
  suggestion: string;
  expectedImpact: string;
}

interface AIInsight {
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical' | 'positive';
  insightType: string;
  actions?: AIAction[];
}

interface KPIProgress {
  channel: string;
  metric: string;
  current: number;
  target: number;
  progressPercent: number;
  projectedTotal: number;
  onTrack: boolean;
}

export default function AIInsightsPage() {
  const { activeCampaignId } = useCampaignStore();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [kpiProgress, setKpiProgress] = useState<KPIProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'performance' | 'optimize'>('performance');
  const [applying, setApplying] = useState<string | null>(null);

  const fetchInsights = async (type: string) => {
    if (!activeCampaignId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/ai/insights/${activeCampaignId}?type=${type}`);
      setInsights(data.insights);
      setKpiProgress(data.kpiProgress);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(activeTab);
  }, [activeCampaignId, activeTab]);

  const refreshInsights = async () => {
    if (!activeCampaignId) return;
    await api.post(`/ai/refresh/${activeCampaignId}`);
    fetchInsights(activeTab);
  };

  const applyAction = async (action: AIAction) => {
    if (!activeCampaignId) return;
    setApplying(action.target);
    try {
      await api.post('/optimize/execute', {
        campaignId: activeCampaignId,
        actionType: action.actionType,
        target: action.target,
        params: { reason: action.suggestion },
      });
      alert(`Action applied: ${action.suggestion}`);
    } catch (err) {
      console.error('Failed to apply action:', err);
    } finally {
      setApplying(null);
    }
  };

  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-500', badge: 'bg-red-100 text-red-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
    positive: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, iconColor: 'text-green-500', badge: 'bg-green-100 text-green-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Brain className="w-7 h-7 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        </div>
        <button
          onClick={refreshInsights}
          data-tour="ai-refresh"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Analysis
        </button>
      </div>

      {/* KPI Progress Summary */}
      {kpiProgress.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kpiProgress.map((kpi) => (
            <div key={kpi.channel} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-gray-500">{kpi.channel}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {kpi.current.toLocaleString()} / {kpi.target.toLocaleString()} {kpi.metric}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${kpi.onTrack ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {kpi.onTrack ? 'On Track' : 'Behind'}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${kpi.onTrack ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(kpi.progressPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">{kpi.progressPercent}%</p>
                <p className="text-xs text-gray-400">Projected: {kpi.projectedTotal.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'performance' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <TrendingUp className="w-4 h-4 inline mr-1" />
          Performance Analysis
        </button>
        <button
          onClick={() => setActiveTab('optimize')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'optimize' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Zap className="w-4 h-4 inline mr-1" />
          Optimization Suggestions
        </button>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-500">AI sedang menganalisa data campaign...</span>
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada insights untuk campaign ini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, idx) => {
            const config = severityConfig[insight.severity];
            const Icon = config.icon;
            return (
              <div key={idx} className={`${config.bg} border ${config.border} rounded-xl p-5`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5 shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                        {insight.severity}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                        {insight.insightType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{insight.content}</p>

                    {/* Actions */}
                    {insight.actions && insight.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Recommended Actions:</p>
                        {insight.actions.map((action, aIdx) => (
                          <div key={aIdx} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{action.suggestion}</p>
                              <p className="text-xs text-gray-500">Impact: {action.expectedImpact}</p>
                            </div>
                            <button
                              onClick={() => applyAction(action)}
                              disabled={applying === action.target}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 shrink-0 ml-3"
                            >
                              {applying === action.target ? 'Applying...' : 'Apply'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
