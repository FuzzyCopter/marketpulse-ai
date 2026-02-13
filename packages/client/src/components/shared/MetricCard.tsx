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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        {trend && <TrendIcon size={16} className={trendColor} />}
      </div>

      <div className="text-2xl font-bold text-gray-900 mb-1">{formatValue(value)}</div>

      {target !== undefined && percentage !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Target: {target.toLocaleString('id-ID')}</span>
            <span className={percentage >= 90 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                percentage >= 90 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        </div>
      )}

      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
  );
}
