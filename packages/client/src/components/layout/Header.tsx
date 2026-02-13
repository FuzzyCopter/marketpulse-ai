import { useCampaignStore } from '../../store/campaign.store';

export default function Header() {
  const { campaigns, activeCampaignId, setActiveCampaign } = useCampaignStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <select
          value={activeCampaignId}
          onChange={(e) => setActiveCampaign(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {campaigns.find(c => c.id === activeCampaignId) && (
          <StatusBadge status={campaigns.find(c => c.id === activeCampaignId)!.status} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Mock Data Mode
        </div>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </header>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    upcoming: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-600',
    paused: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
