import { useEffect, useState } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import api from '../services/api';
import {
  Briefcase, Plus, Trash2, Edit3, X, Check, FolderOpen,
  Calendar, Target, DollarSign, Hash, Building2, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Client {
  id: number;
  name: string;
  industry: string;
  createdAt: string;
}

interface CampaignChannel {
  channelType: string;
  targetMetric: string;
  targetValue: number;
  budget: number;
}

interface ManagedCampaign {
  id: number;
  clientId: number;
  clientName: string;
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalBudget: number;
  channels: CampaignChannel[];
  createdAt: string;
}

const CHANNEL_OPTIONS = [
  { value: 'google_search', label: 'Google Search (SEM)', defaultMetric: 'clicks' },
  { value: 'google_discovery', label: 'Google Discovery', defaultMetric: 'visits' },
  { value: 'social_tiktok', label: 'TikTok Ads', defaultMetric: 'clicks' },
  { value: 'social_instagram', label: 'Instagram Ads', defaultMetric: 'clicks' },
  { value: 'social_facebook', label: 'Facebook Ads', defaultMetric: 'clicks' },
];

const CHANNEL_LABELS: Record<string, string> = {
  google_search: 'Google Search (SEM)',
  google_discovery: 'Google Discovery',
  social_tiktok: 'TikTok Ads',
  social_instagram: 'Instagram Ads',
  social_facebook: 'Facebook Ads',
};

export default function ManagePage() {
  const { fetchCampaigns } = useCampaignStore();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'clients'>('campaigns');
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<ManagedCampaign[]>([]);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
  const [newClient, setNewClient] = useState({ name: '', industry: '' });

  const [newCampaign, setNewCampaign] = useState({
    clientId: 0,
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    channels: [] as { channelType: string; targetMetric: string; targetValue: number; budget: number }[],
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [clientsRes, campaignsRes] = await Promise.all([
      api.get('/manage/clients'),
      api.get('/manage/campaigns'),
    ]);
    setClients(clientsRes.data);
    setCampaigns(campaignsRes.data);
  };

  // ── Client actions ────────────────────────────────────────────
  const createClient = async () => {
    if (!newClient.name.trim()) return;
    await api.post('/manage/clients', newClient);
    setNewClient({ name: '', industry: '' });
    setShowNewClient(false);
    fetchAll();
  };

  const deleteClient = async (id: number) => {
    if (!confirm('Delete this client?')) return;
    try {
      await api.delete(`/manage/clients/${id}`);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  // ── Campaign actions ──────────────────────────────────────────
  const toggleChannel = (channelType: string) => {
    const exists = newCampaign.channels.find(c => c.channelType === channelType);
    if (exists) {
      setNewCampaign({
        ...newCampaign,
        channels: newCampaign.channels.filter(c => c.channelType !== channelType),
      });
    } else {
      const opt = CHANNEL_OPTIONS.find(o => o.value === channelType);
      setNewCampaign({
        ...newCampaign,
        channels: [...newCampaign.channels, {
          channelType,
          targetMetric: opt?.defaultMetric || 'clicks',
          targetValue: 0,
          budget: 0,
        }],
      });
    }
  };

  const updateChannel = (channelType: string, field: string, value: number | string) => {
    setNewCampaign({
      ...newCampaign,
      channels: newCampaign.channels.map(c =>
        c.channelType === channelType ? { ...c, [field]: value } : c
      ),
    });
  };

  const createCampaign = async () => {
    if (!newCampaign.clientId || !newCampaign.name || !newCampaign.startDate || !newCampaign.endDate) {
      alert('Please fill in client, name, start date, and end date');
      return;
    }
    if (newCampaign.channels.length === 0) {
      alert('Please add at least one channel');
      return;
    }
    await api.post('/manage/campaigns', newCampaign);
    setNewCampaign({ clientId: 0, name: '', description: '', startDate: '', endDate: '', channels: [] });
    setShowNewCampaign(false);
    fetchAll();
    // Refresh global campaign list so it shows in selector
    fetchCampaigns();
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign?')) return;
    await api.delete(`/manage/campaigns/${id}`);
    fetchAll();
    fetchCampaigns();
  };

  const getStatus = (start: string, end: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (today < start) return 'upcoming';
    if (today > end) return 'completed';
    return 'active';
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    upcoming: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-600',
  };

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
    return `Rp ${n.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Manage</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'campaigns' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-1" />
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'clients' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-1" />
            Clients ({clients.length})
          </button>
        </div>
        <button
          data-tour="manage-new"
          onClick={() => activeTab === 'campaigns' ? setShowNewCampaign(true) : setShowNewClient(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-1" />
          New {activeTab === 'campaigns' ? 'Campaign' : 'Client'}
        </button>
      </div>

      {/* ── CAMPAIGNS TAB ────────────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <>
          {/* New Campaign Form */}
          {showNewCampaign && (
            <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">New Campaign</h3>
                <button onClick={() => setShowNewCampaign(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Client</label>
                  <select
                    value={newCampaign.clientId}
                    onChange={(e) => setNewCampaign({ ...newCampaign, clientId: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={0}>Select client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Toyota Avanza Launch 2026"
                  />
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Campaign description..."
                  />
                </div>
              </div>

              {/* Channel Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-600 mb-2">Channels & KPI Targets</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CHANNEL_OPTIONS.map(opt => {
                    const isSelected = newCampaign.channels.some(c => c.channelType === opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleChannel(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Channel KPI configs */}
                {newCampaign.channels.length > 0 && (
                  <div className="space-y-3">
                    {newCampaign.channels.map(ch => (
                      <div key={ch.channelType} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-800 mb-3">
                          {CHANNEL_LABELS[ch.channelType]}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              <Target className="w-3 h-3 inline mr-1" />
                              Target Metric
                            </label>
                            <select
                              value={ch.targetMetric}
                              onChange={(e) => updateChannel(ch.channelType, 'targetMetric', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                            >
                              <option value="clicks">Clicks</option>
                              <option value="visits">Visits</option>
                              <option value="impressions">Impressions</option>
                              <option value="conversions">Conversions</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              <Hash className="w-3 h-3 inline mr-1" />
                              Target Value
                            </label>
                            <input
                              type="number"
                              value={ch.targetValue || ''}
                              onChange={(e) => updateChannel(ch.channelType, 'targetValue', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                              placeholder="e.g. 30000"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              <DollarSign className="w-3 h-3 inline mr-1" />
                              Budget (Rp)
                            </label>
                            <input
                              type="number"
                              value={ch.budget || ''}
                              onChange={(e) => updateChannel(ch.channelType, 'budget', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              placeholder="e.g. 45000000"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewCampaign(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createCampaign}
                  disabled={!newCampaign.name || !newCampaign.clientId}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          )}

          {/* Campaigns List */}
          {campaigns.length === 0 && !showNewCampaign ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">No custom campaigns yet</p>
              <p className="text-xs text-gray-400">Honda campaigns (MBBH & Bale Santai) are pre-configured. Create new campaigns here for other projects.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(campaign => {
                const status = getStatus(campaign.startDate, campaign.endDate);
                const isExpanded = expandedCampaign === campaign.id;
                return (
                  <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{campaign.clientName}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs text-gray-400">
                              {new Date(campaign.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              {' - '}
                              {new Date(campaign.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status]}`}>
                          {status}
                        </span>
                        <span className="text-xs text-gray-400">{campaign.channels.length} ch</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        {campaign.description && (
                          <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-900">{campaign.totalDays}</p>
                            <p className="text-xs text-gray-500">Days</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-900">{campaign.channels.length}</p>
                            <p className="text-xs text-gray-500">Channels</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(campaign.totalBudget)}</p>
                            <p className="text-xs text-gray-500">Total Budget</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-900">
                              {campaign.channels.reduce((s, c) => s + c.targetValue, 0).toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500">Total Target</p>
                          </div>
                        </div>

                        {/* Channel details */}
                        <div className="space-y-2 mb-4">
                          {campaign.channels.map(ch => (
                            <div key={ch.channelType} className="flex items-center justify-between bg-indigo-50/50 rounded-lg px-3 py-2">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{CHANNEL_LABELS[ch.channelType] || ch.channelType}</p>
                                <p className="text-xs text-gray-500">Target: {ch.targetValue.toLocaleString('id-ID')} {ch.targetMetric}</p>
                              </div>
                              <span className="text-sm text-gray-600">{formatCurrency(ch.budget)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteCampaign(campaign.id); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── CLIENTS TAB ──────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <>
          {/* New Client Form */}
          {showNewClient && (
            <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">New Client</h3>
                <button onClick={() => setShowNewClient(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Toyota Indonesia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Industry</label>
                  <input
                    type="text"
                    value={newClient.industry}
                    onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Automotive, F&B, Tech"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowNewClient(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createClient}
                    disabled={!newClient.name.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add Client
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clients List */}
          <div className="space-y-3">
            {clients.map(client => (
              <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {client.industry && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{client.industry}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          Added {new Date(client.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {campaigns.filter(c => c.clientId === client.id).length} campaigns
                    </span>
                    {client.id !== 1 && (
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <p className="text-sm text-indigo-700">
          <strong>Note:</strong> Honda campaigns (MBBH 2026 & Bale Santai Honda) are pre-configured with mock data.
          New campaigns created here will appear in the campaign selector. Connect real API data sources in Settings to get live metrics.
        </p>
      </div>
    </div>
  );
}
