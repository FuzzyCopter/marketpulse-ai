import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  target?: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'flat';
  format?: 'number' | 'currency' | 'percentage';
  subtitle?: string;
}

export default function MetricCard({ title, value, target, percentage, trend, format = 'number', subtitle }: MetricCardProps) {
  const formatValue = (v: string | number) => {
    if (typeof v === 'string') return v;
    if (format === 'currency') return `Rp ${v.toLocaleString('id-ID')}`;
    if (format === 'percentage') return `${v.toFixed(1)}%`;
    return v.toLocaleString('id-ID');
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400';
  const trendBg = trend === 'up' ? 'bg-green-50' : trend === 'down' ? 'bg-red-50' : 'bg-gray-50';

  const isOnTrack = percentage !== undefined && percentage >= 90;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:shadow-gray-200/50 transition-all hover:-translate-y-0.5 group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        {trend && (
          <div className={`w-7 h-7 ${trendBg} rounded-lg flex items-center justify-center`}>
            <TrendIcon size={14} className={trendColor} />
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-gray-900 mb-1">{formatValue(value)}</div>

      {target !== undefined && percentage !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Target: {target.toLocaleString('id-ID')}</span>
            <span className={`font-semibold ${isOnTrack ? 'text-green-600' : 'text-amber-600'}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                percentage >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' : percentage >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'
              }`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        </div>
      )}

      {subtitle && (
        <p className="text-xs text-gray-400 mt-2.5 flex items-center gap-1">
          {subtitle.includes('On Track') ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {subtitle}
            </>
          ) : subtitle.includes('Behind') ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {subtitle}
            </>
          ) : subtitle}
        </p>
      )}
    </div>
  );
}
