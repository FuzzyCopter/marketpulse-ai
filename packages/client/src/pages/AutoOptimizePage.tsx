import { useEffect, useState } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import api from '../services/api';
import { Zap, Play, Pause, Trash2, Plus, History, Settings2, ChevronDown, ChevronUp } from 'lucide-react';

interface OptimizeRule {
  id: number;
  name: string;
  description: string;
  channelType: string | null;
  metric: string;
  condition: string;
  threshold: number;
  lookbackDays: number;
  actionType: string;
  actionParams: Record<string, unknown>;
  status: string;
  lastEvaluatedAt: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
}

interface ActionLog {
  id: number;
  campaignId: number;
  actionType: string;
  targetEntity: string;
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  reason: string;
  status: string;
  executedAt: string;
  executedBy: string;
}

export default function AutoOptimizePage() {
  const { activeCampaignId } = useCampaignStore();
  const [rules, setRules] = useState<OptimizeRule[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [showNewRule, setShowNewRule] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  // New rule form state
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    metric: 'cpc',
    condition: 'above',
    threshold: 0,
    lookbackDays: 3,
    actionType: 'adjust_bid',
    actionParams: { adjustPercent: -10 },
  });

  useEffect(() => {
    if (!activeCampaignId) return;
    fetchRules();
    fetchLogs();
  }, [activeCampaignId]);

  const fetchRules = async () => {
    const { data } = await api.get(`/optimize/rules?campaignId=${activeCampaignId}`);
    setRules(data);
  };

  const fetchLogs = async () => {
    const { data } = await api.get(`/optimize/logs?campaignId=${activeCampaignId}`);
    setLogs(data);
  };

  const toggleRule = async (rule: OptimizeRule) => {
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    await api.patch(`/optimize/rules/${rule.id}`, { status: newStatus });
    fetchRules();
  };

  const deleteRuleHandler = async (id: number) => {
    if (!confirm('Hapus rule ini?')) return;
    await api.delete(`/optimize/rules/${id}`);
    fetchRules();
  };

  const runAllRules = async () => {
    if (!activeCampaignId) return;
    setEvaluating(true);
    try {
      const { data } = await api.post(`/optimize/evaluate/${activeCampaignId}`);
      alert(`Rules evaluated: ${data.triggered} actions triggered`);
      fetchLogs();
      fetchRules();
    } finally {
      setEvaluating(false);
    }
  };

  const createNewRule = async () => {
    await api.post('/optimize/rules', {
      campaignId: activeCampaignId,
      channelType: 'google_search',
      ...newRule,
    });
    setShowNewRule(false);
    setNewRule({ name: '', description: '', metric: 'cpc', condition: 'above', threshold: 0, lookbackDays: 3, actionType: 'adjust_bid', actionParams: { adjustPercent: -10 } });
    fetchRules();
  };

  const metricLabels: Record<string, string> = {
    cpc: 'CPC (Rp)',
    ctr: 'CTR (%)',
    quality_score: 'Quality Score',
    clicks: 'Clicks',
    cost: 'Cost (Rp)',
    conversions: 'Conversions',
  };

  const conditionLabels: Record<string, string> = {
    above: 'di atas',
    below: 'di bawah',
    change_pct_up: 'naik lebih dari',
    change_pct_down: 'turun lebih dari',
  };

  const actionLabels: Record<string, string> = {
    adjust_bid: 'Adjust Bid',
    pause_keyword: 'Pause Keyword',
    enable_keyword: 'Enable Keyword',
    adjust_budget: 'Adjust Budget',
    pause_campaign: 'Pause Campaign',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-7 h-7 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">Auto-Optimize</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewRule(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
          <button
            onClick={runAllRules}
            disabled={evaluating}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {evaluating ? 'Running...' : 'Run All Rules'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-sm text-orange-800">
          <strong>Auto-Optimize</strong> menjalankan rules otomatis untuk mengoptimasi campaign.
          Di mode <strong>mock</strong>, actions dicatat tapi tidak mengubah data real.
          Di mode <strong>live</strong>, actions langsung dieksekusi ke Google Ads via API.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'rules' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Settings2 className="w-4 h-4" />
          Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'history' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <History className="w-4 h-4" />
          Action History ({logs.length})
        </button>
      </div>

      {/* New Rule Form */}
      {showNewRule && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Rule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Rule Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. CPC Terlalu Tinggi"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Describe what this rule does"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">When Metric</label>
              <select
                value={newRule.metric}
                onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(metricLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Condition</label>
              <select
                value={newRule.condition}
                onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(conditionLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Threshold</label>
              <input
                type="number"
                value={newRule.threshold}
                onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Then Action</label>
              <select
                value={newRule.actionType}
                onChange={(e) => setNewRule({ ...newRule, actionType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(actionLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button
                onClick={() => setShowNewRule(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createNewRule}
                disabled={!newRule.name}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Settings2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada optimization rules</p>
            </div>
          ) : rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl border border-gray-200">
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${rule.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <p className="text-sm text-gray-500">
                      If <strong>{metricLabels[rule.metric] || rule.metric}</strong> {conditionLabels[rule.condition] || rule.condition} <strong>{rule.threshold}</strong> → {actionLabels[rule.actionType] || rule.actionType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${rule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {rule.status}
                  </span>
                  {expandedRule === rule.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {expandedRule === rule.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-400">Lookback</p>
                      <p className="font-medium">{rule.lookbackDays} days</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last Evaluated</p>
                      <p className="font-medium">{rule.lastEvaluatedAt ? new Date(rule.lastEvaluatedAt).toLocaleString('id-ID') : 'Never'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last Triggered</p>
                      <p className="font-medium">{rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt).toLocaleString('id-ID') : 'Never'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleRule(rule); }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${rule.status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {rule.status === 'active' ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRuleHandler(rule.id); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada action yang dijalankan</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">By</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(log.executedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {actionLabels[log.actionType] || log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">{log.targetEntity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[250px] truncate">{log.reason}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.executedBy === 'ai' ? 'bg-purple-100 text-purple-700' :
                        log.executedBy === 'rule' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.executedBy}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.status === 'executed' ? 'bg-green-100 text-green-700' :
                        log.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
