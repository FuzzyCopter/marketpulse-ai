import { useEffect } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import KPISection from '../components/dashboard/KPISection';
import ChannelBreakdown from '../components/dashboard/ChannelBreakdown';
import TrendChart from '../components/dashboard/TrendChart';
import { MousePointerClick, Eye, Globe, Wallet, Calendar, Target } from 'lucide-react';

export default function DashboardPage() {
  const { dashboardData, isLoading, activeCampaignId, fetchDashboard } = useCampaignStore();

  useEffect(() => {
    fetchDashboard(activeCampaignId);
  }, [activeCampaignId, fetchDashboard]);

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Skeleton loading */}
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-64 mb-2" />
            <div className="skeleton h-4 w-48" />
          </div>
          <div className="skeleton h-16 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const { campaign, kpis, channelBreakdown, todayMetrics } = dashboardData;
  const progressPercent = campaign.totalDays > 0 ? Math.round((campaign.daysElapsed / campaign.totalDays) * 100) : 0;

  const quickMetrics = [
    { title: 'Impressions', value: todayMetrics.impressions, icon: Eye, color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50' },
    { title: 'Clicks', value: todayMetrics.clicks, icon: MousePointerClick, color: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50' },
    { title: 'Visits', value: todayMetrics.visits, icon: Globe, color: 'from-purple-500 to-purple-600', bgLight: 'bg-purple-50' },
    { title: 'Cost', value: todayMetrics.cost, icon: Wallet, color: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50', isCurrency: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Campaign Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>{campaign.startDate} — {campaign.endDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Progress</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">{progressPercent}%</span>
              </div>
            </div>
            <div className="text-center border-l border-gray-200 pl-4 md:pl-6">
              <p className="text-sm text-gray-500">Days</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                <span className="text-blue-600">{campaign.daysElapsed}</span>
                <span className="text-gray-400 text-base">/{campaign.totalDays}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" data-tour="quick-metrics">
        {quickMetrics.map(({ title, value, icon: Icon, color, bgLight, isCurrency }, idx) => (
          <div
            key={title}
            className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 hover:shadow-lg hover:shadow-gray-200/50 transition-all hover:-translate-y-0.5"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs md:text-sm text-gray-500 font-medium">{title}</span>
              <div className={`w-8 h-8 ${bgLight} rounded-lg flex items-center justify-center`}>
                <Icon size={16} className={`bg-gradient-to-r ${color} bg-clip-text`} style={{ color: color.includes('blue') ? '#3b82f6' : color.includes('emerald') ? '#10b981' : color.includes('purple') ? '#8b5cf6' : '#f59e0b' }} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {isCurrency ? `Rp ${(value as number).toLocaleString('id-ID')}` : (value as number).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Today's total</p>
          </div>
        ))}
      </div>

      {/* KPI Progress */}
      <div data-tour="kpi-section">
        <KPISection kpis={kpis} daysElapsed={campaign.daysElapsed} totalDays={campaign.totalDays} />
      </div>

      {/* Charts & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart />
        <ChannelBreakdown channels={channelBreakdown} />
      </div>
    </div>
  );
}
