import { useEffect, useState } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import api from '../services/api';
import { Bell, Check, CheckCheck, Plus, Trash2, Play, Pause, Settings2, AlertTriangle, X } from 'lucide-react';

interface AlertRule {
  id: number;
  name: string;
  metricName: string;
  condition: string;
  threshold: number;
  channelType: string | null;
  isActive: boolean;
  notification: { inApp?: boolean; email?: boolean };
  createdAt: string;
}

interface AlertEvent {
  id: number;
  ruleId: number;
  campaignId: number;
  triggeredAt: string;
  metricValue: number;
  thresholdValue: number;
  message: string;
  isAcknowledged: boolean;
}

interface AlertStats {
  total: number;
  unacknowledged: number;
  critical: number;
}

export default function AlertsPage() {
  const { activeCampaignId } = useCampaignStore();
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [stats, setStats] = useState<AlertStats>({ total: 0, unacknowledged: 0, critical: 0 });
  const [activeTab, setActiveTab] = useState<'events' | 'rules'>('events');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', metricName: 'clicks', condition: 'below', threshold: 0, channelType: 'google_search' });

  useEffect(() => {
    if (!activeCampaignId) return;
    fetchAll();
  }, [activeCampaignId]);

  const fetchAll = async () => {
    const [eventsRes, rulesRes, statsRes] = await Promise.all([
      api.get(`/alerts/events?campaignId=${activeCampaignId}`),
      api.get(`/alerts/rules?campaignId=${activeCampaignId}`),
      api.get(`/alerts/stats/${activeCampaignId}`),
    ]);
    setEvents(eventsRes.data);
    setRules(rulesRes.data);
    setStats(statsRes.data);
  };

  const acknowledge = async (id: number) => {
    await api.post(`/alerts/events/${id}/acknowledge`);
    fetchAll();
  };

  const acknowledgeAllHandler = async () => {
    await api.post('/alerts/events/acknowledge-all', { campaignId: activeCampaignId });
    fetchAll();
  };

  const evaluateRules = async () => {
    const { data } = await api.post(`/alerts/evaluate/${activeCampaignId}`);
    alert(`${data.triggered} alerts triggered`);
    fetchAll();
  };

  const toggleRule = async (rule: AlertRule) => {
    await api.patch(`/alerts/rules/${rule.id}`, { isActive: !rule.isActive });
    fetchAll();
  };

  const deleteRuleHandler = async (id: number) => {
    if (!confirm('Hapus alert rule ini?')) return;
    await api.delete(`/alerts/rules/${id}`);
    fetchAll();
  };

  const createRuleHandler = async () => {
    await api.post('/alerts/rules', {
      campaignId: activeCampaignId,
      ...newRule,
      notification: { inApp: true },
    });
    setShowNewRule(false);
    setNewRule({ name: '', metricName: 'clicks', condition: 'below', threshold: 0, channelType: 'google_search' });
    fetchAll();
  };

  const filteredEvents = events.filter(e => {
    if (filter === 'unread') return !e.isAcknowledged;
    if (filter === 'read') return e.isAcknowledged;
    return true;
  });

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const metricLabels: Record<string, string> = {
    clicks: 'Clicks', visits: 'Visits', cpc: 'CPC', ctr: 'CTR', cost: 'Cost', conversions: 'Conversions',
  };

  const channelLabels: Record<string, string> = {
    google_search: 'Google Search', google_discovery: 'Google Discovery',
    social_tiktok: 'TikTok', social_instagram: 'Instagram', social_facebook: 'Facebook',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <div className="flex gap-2">
            <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {stats.unacknowledged} unread
            </span>
            <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {stats.total} total
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-tour="alert-tabs">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'rules' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Settings2 className="w-4 h-4 inline mr-1" />
            Rules ({rules.length})
          </button>
        </div>
        <div className="flex gap-2">
          {activeTab === 'events' && (
            <>
              <button onClick={evaluateRules} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200">
                <Play className="w-3 h-3 inline mr-1" /> Check Now
              </button>
              <button onClick={acknowledgeAllHandler} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">
                <CheckCheck className="w-3 h-3 inline mr-1" /> Acknowledge All
              </button>
            </>
          )}
          {activeTab === 'rules' && (
            <button onClick={() => setShowNewRule(true)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
              <Plus className="w-3 h-3 inline mr-1" /> New Rule
            </button>
          )}
        </div>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <>
          {/* Filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {(['all', 'unread', 'read'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No alerts to show</p>
              </div>
            ) : filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  event.isAcknowledged ? 'border-gray-200 opacity-60' : 'border-red-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${event.isAcknowledged ? 'bg-gray-300' : 'bg-red-500 animate-pulse'}`} />
                    <div>
                      <p className={`text-sm ${event.isAcknowledged ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                        {event.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">{timeAgo(event.triggeredAt)}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          Rule #{event.ruleId}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!event.isAcknowledged && (
                    <button
                      onClick={() => acknowledge(event.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors shrink-0"
                      title="Acknowledge"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <>
          {/* New Rule Form */}
          {showNewRule && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">New Alert Rule</h3>
                <button onClick={() => setShowNewRule(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input
                    type="text" value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. CPC Spike Alert"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Metric</label>
                  <select value={newRule.metricName} onChange={(e) => setNewRule({ ...newRule, metricName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(metricLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Channel</label>
                  <select value={newRule.channelType} onChange={(e) => setNewRule({ ...newRule, channelType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(channelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Condition</label>
                  <select value={newRule.condition} onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Threshold</label>
                  <input type="number" value={newRule.threshold}
                    onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button onClick={() => setShowNewRule(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Cancel</button>
                  <button onClick={createRuleHandler} disabled={!newRule.name}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50">Create</button>
                </div>
              </div>
            </div>
          )}

          {/* Rules List */}
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <p className="text-sm text-gray-500">
                        When <strong>{metricLabels[rule.metricName] || rule.metricName}</strong>
                        {' '}{rule.condition === 'above' ? '>' : '<'} <strong>{rule.threshold.toLocaleString()}</strong>
                        {rule.channelType && <span className="text-gray-400"> on {channelLabels[rule.channelType] || rule.channelType}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {rule.isActive ? 'active' : 'paused'}
                    </span>
                    <div className="flex gap-1">
                      {rule.notification.email && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">email</span>}
                      {rule.notification.inApp && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">in-app</span>}
                    </div>
                    <button onClick={() => toggleRule(rule)}
                      className={`p-1.5 rounded-lg ${rule.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}>
                      {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteRuleHandler(rule.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
