import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { Settings, User, Database, Shield, Bell, Plug, Save, Check, RotateCcw } from 'lucide-react';
import { resetOnboardingTour } from '../components/shared/OnboardingTour';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'integrations' | 'system'>('profile');
  const [saved, setSaved] = useState(false);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'integrations' as const, label: 'Integrations', icon: Plug },
    { id: 'system' as const, label: 'System', icon: Database },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Saved notification */}
      {saved && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg toast-enter">
          <Check size={16} />
          <span className="text-sm font-medium">Settings saved</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Profile Information</h3>
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{user?.fullName}</h4>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">{user?.role}</span>
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Tenant #{user?.tenantId}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.fullName}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <button
              onClick={showSaved}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Security</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
            <button
              onClick={showSaved}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Notification Preferences</h3>
          <div className="space-y-5">
            {[
              { label: 'Alert Notifications', desc: 'Terima notifikasi saat alert rule trigger', enabled: true },
              { label: 'Campaign Updates', desc: 'Update harian performa campaign', enabled: true },
              { label: 'AI Insights', desc: 'Notifikasi saat ada insight baru dari AI', enabled: false },
              { label: 'Report Ready', desc: 'Notifikasi saat report selesai di-generate', enabled: true },
              { label: 'Budget Alerts', desc: 'Warning saat budget mendekati limit', enabled: true },
            ].map(({ label, desc, enabled }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={enabled} className="sr-only peer" />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner" />
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={showSaved}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save size={16} />
            Save Preferences
          </button>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {[
            { name: 'Google Ads', desc: 'Connect Google Ads account untuk data SEM live', icon: '🔍', bg: 'bg-blue-50', border: 'border-blue-200' },
            { name: 'Google Analytics', desc: 'Connect GA4 untuk website traffic data', icon: '📊', bg: 'bg-amber-50', border: 'border-amber-200' },
            { name: 'Google Search Console', desc: 'Connect GSC untuk SEO ranking data', icon: '🌐', bg: 'bg-green-50', border: 'border-green-200' },
            { name: 'Meta Ads', desc: 'Connect Facebook & Instagram Ads', icon: '📱', bg: 'bg-indigo-50', border: 'border-indigo-200' },
            { name: 'TikTok Ads', desc: 'Connect TikTok Ads Manager', icon: '🎵', bg: 'bg-pink-50', border: 'border-pink-200' },
            { name: 'Claude AI (Anthropic)', desc: 'API key untuk AI insights & analysis', icon: '🤖', bg: 'bg-purple-50', border: 'border-purple-200' },
          ].map(({ name, desc, icon, bg, border }) => (
            <div key={name} className={`bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} ${border} border rounded-xl flex items-center justify-center text-xl`}>
                  {icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{name}</h4>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Not Connected</span>
                <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Version</p>
                <p className="text-lg font-bold text-gray-900">1.0.0</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Data Source</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  <p className="text-lg font-bold text-amber-600">Mock</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Environment</p>
                <p className="text-lg font-bold text-gray-900">Production</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Status</h3>
            <div className="space-y-3">
              {[
                { name: 'Backend API', url: '/api/health', status: 'online' },
                { name: 'WebSocket', url: 'Socket.IO', status: 'online' },
                { name: 'AI Engine', url: '/ai/*', status: 'mock' },
              ].map(({ name, url, status }) => (
                <div key={name} className="flex items-center justify-between py-2.5 px-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{name}</p>
                    <p className="text-xs text-gray-400">{url}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    status === 'online'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {status === 'online' ? 'Online' : 'Mock Mode'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Onboarding</h3>
            <p className="text-sm text-gray-500 mb-4">Tampilkan kembali tour walkthrough yang menjelaskan semua fitur MarketPulse AI.</p>
            <button
              onClick={() => { resetOnboardingTour(); window.location.reload(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw size={16} />
              Restart Tour
            </button>
          </div>

          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">MarketPulse AI</h3>
            <p className="text-sm text-gray-400 mb-4">SEO & SEM Command Center by Manna Digital Agency</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Built with React + Node.js + TypeScript</span>
              <span>&copy; 2026 Manna Digital</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
