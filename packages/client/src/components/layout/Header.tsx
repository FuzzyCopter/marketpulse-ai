import { useCampaignStore } from '../../store/campaign.store';
import { Menu, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { campaigns, activeCampaignId, setActiveCampaign } = useCampaignStore();
  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={20} />
        </button>

        <div className="relative" data-tour="campaign-selector">
          <select
            value={activeCampaignId}
            onChange={(e) => setActiveCampaign(Number(e.target.value))}
            className="appearance-none border border-gray-200 rounded-xl px-4 py-2 pr-9 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50 hover:bg-white transition-colors cursor-pointer"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {activeCampaign && <StatusBadge status={activeCampaign.status} />}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-700 font-medium">Mock Data</span>
        </div>
        <span className="hidden md:block text-xs text-gray-400">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </header>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
    upcoming: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    completed: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
    paused: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  };

  const s = config[status] || config.active;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
