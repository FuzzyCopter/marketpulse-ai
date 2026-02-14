import type { KPIProgress } from '@marketpulse/shared';
import MetricCard from '../shared/MetricCard';
import { Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface KPISectionProps {
  kpis: KPIProgress[];
  daysElapsed: number;
  totalDays: number;
}

export default function KPISection({ kpis, daysElapsed, totalDays }: KPISectionProps) {
  const onTrack = kpis.filter(k => k.onTrack).length;
  const behind = kpis.length - onTrack;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">KPI Progress</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 size={15} />
            <span className="font-medium">{onTrack} on track</span>
          </span>
          {behind > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-amber-600">
              <AlertTriangle size={15} />
              <span className="font-medium">{behind} behind</span>
            </span>
          )}
          <span className="text-sm text-gray-400 hidden sm:inline">
            Day {daysElapsed}/{totalDays}
          </span>
        </div>
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
