import { useEffect } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import KPISection from '../components/dashboard/KPISection';
import ChannelBreakdown from '../components/dashboard/ChannelBreakdown';
import TrendChart from '../components/dashboard/TrendChart';
import MetricCard from '../components/shared/MetricCard';

export default function DashboardPage() {
  const { dashboardData, isLoading, activeCampaignId, fetchDashboard } = useCampaignStore();

  useEffect(() => {
    fetchDashboard(activeCampaignId);
  }, [activeCampaignId, fetchDashboard]);

  if (isLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { campaign, kpis, channelBreakdown, todayMetrics } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {campaign.startDate} to {campaign.endDate}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Campaign Progress</p>
          <p className="text-2xl font-bold text-gray-900">
            {campaign.daysElapsed}/{campaign.totalDays} days
          </p>
        </div>
      </div>

      {/* Today's Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Today Impressions" value={todayMetrics.impressions} />
        <MetricCard title="Today Clicks" value={todayMetrics.clicks} />
        <MetricCard title="Today Visits" value={todayMetrics.visits} />
        <MetricCard title="Today Cost" value={todayMetrics.cost} format="currency" />
      </div>

      {/* KPI Progress */}
      <KPISection kpis={kpis} daysElapsed={campaign.daysElapsed} totalDays={campaign.totalDays} />

      {/* Charts & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart />
        <ChannelBreakdown channels={channelBreakdown} />
      </div>
    </div>
  );
}
