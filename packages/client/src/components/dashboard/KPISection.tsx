import type { KPIProgress } from '@marketpulse/shared';
import MetricCard from '../shared/MetricCard';

interface KPISectionProps {
  kpis: KPIProgress[];
  daysElapsed: number;
  totalDays: number;
}

export default function KPISection({ kpis, daysElapsed, totalDays }: KPISectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">KPI Progress</h2>
        <span className="text-sm text-gray-500">
          Day {daysElapsed} of {totalDays} ({Math.max(0, totalDays - daysElapsed)} remaining)
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <MetricCard
            key={kpi.metricName}
            title={kpi.metricName}
            value={kpi.actual}
            target={kpi.target}
            percentage={kpi.percentage}
            trend={kpi.trend}
            subtitle={`Projected: ${kpi.projected.toLocaleString('id-ID')} | ${kpi.onTrack ? 'On Track' : 'Behind Target'}`}
          />
        ))}
      </div>
    </div>
  );
}
