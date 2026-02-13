import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useCampaignStore } from '../../store/campaign.store';

interface ChartDataPoint {
  date: string;
  clicks: number;
  visits: number;
  impressions: number;
  cost: number;
}

export default function TrendChart() {
  const { activeCampaignId } = useCampaignStore();
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [metric, setMetric] = useState<'clicks' | 'visits' | 'impressions'>('clicks');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`/campaigns/${activeCampaignId}/metrics`);
        const channels = res.data.channels;

        // Merge all channels by date
        const dateMap: Record<string, ChartDataPoint> = {};

        for (const channelKey of Object.keys(channels)) {
          const channelData = channels[channelKey];
          for (const point of channelData.data) {
            if (!dateMap[point.metricDate]) {
              dateMap[point.metricDate] = { date: point.metricDate, clicks: 0, visits: 0, impressions: 0, cost: 0 };
            }
            dateMap[point.metricDate].clicks += point.clicks;
            dateMap[point.metricDate].visits += point.visits;
            dateMap[point.metricDate].impressions += point.impressions;
            dateMap[point.metricDate].cost += point.cost;
          }
        }

        const sorted = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
        setData(sorted);
      } catch {
        setData([]);
      }
    }
    fetchData();
  }, [activeCampaignId]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Campaign hasn't started yet. Data will appear when the campaign is active.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Daily Trends</h3>
        <div className="flex gap-2">
          {(['clicks', 'visits', 'impressions'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 text-xs rounded-lg ${
                metric === m ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <Tooltip
            formatter={(value: number) => [value.toLocaleString('id-ID'), metric]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line type="monotone" dataKey={metric} stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
