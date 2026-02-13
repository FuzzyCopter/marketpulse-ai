import { Bell, Check } from 'lucide-react';

export default function AlertsPage() {
  const alerts = [
    { id: 1, message: 'MBBH campaign starts tomorrow (Feb 14)', severity: 'info', time: '2 hours ago', acknowledged: false },
    { id: 2, message: 'Google Discovery budget 80% spent', severity: 'warning', time: '5 hours ago', acknowledged: false },
    { id: 3, message: 'Keyword "mudik bareng honda" position improved to #1', severity: 'positive', time: '1 day ago', acknowledged: true },
    { id: 4, message: 'Page speed dropped to 2.5s on /mbbh-faq', severity: 'critical', time: '2 days ago', acknowledged: true },
  ];

  const severityStyles: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
    positive: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
          {alerts.filter(a => !a.acknowledged).length} unread
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={`border rounded-lg p-4 ${severityStyles[alert.severity]} ${alert.acknowledged ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={16} />
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs opacity-70 mt-1">{alert.time}</p>
                </div>
              </div>
              {!alert.acknowledged && (
                <button className="text-gray-400 hover:text-green-600 p-1">
                  <Check size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
