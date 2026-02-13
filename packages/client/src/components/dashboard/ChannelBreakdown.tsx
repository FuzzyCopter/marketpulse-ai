import type { ChannelMetrics } from '@marketpulse/shared';

interface ChannelBreakdownProps {
  channels: ChannelMetrics[];
}

export default function ChannelBreakdown({ channels }: ChannelBreakdownProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Channel Breakdown</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-500 font-medium">Channel</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Impressions</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Clicks</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Visits</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Cost</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Target</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch) => (
              <tr key={ch.channelType} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium text-gray-800">{ch.label}</td>
                <td className="py-3 px-2 text-right text-gray-600">{ch.metrics.impressions.toLocaleString('id-ID')}</td>
                <td className="py-3 px-2 text-right text-gray-600">{ch.metrics.clicks.toLocaleString('id-ID')}</td>
                <td className="py-3 px-2 text-right text-gray-600">{ch.metrics.visits.toLocaleString('id-ID')}</td>
                <td className="py-3 px-2 text-right text-gray-600">Rp {ch.metrics.cost.toLocaleString('id-ID')}</td>
                <td className="py-3 px-2 text-right text-gray-600">{ch.target.toLocaleString('id-ID')} {ch.targetMetric}</td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${ch.progress >= 90 ? 'bg-green-500' : ch.progress >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, ch.progress)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-12 text-right">{ch.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
