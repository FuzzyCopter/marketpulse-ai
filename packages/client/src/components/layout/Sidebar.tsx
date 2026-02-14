import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, TrendingUp, FileText, Bell, Settings, LogOut, Brain, Zap, X, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sem', icon: Search, label: 'SEM' },
  { to: '/seo', icon: TrendingUp, label: 'SEO' },
  { to: '/ai-insights', icon: Brain, label: 'AI Insights' },
  { to: '/auto-optimize', icon: Zap, label: 'Auto-Optimize' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout, user } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-brand-900 text-white flex flex-col min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">MarketPulse AI</h1>
              <p className="text-[10px] text-blue-300 tracking-wider uppercase">Command Center</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-4 mb-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Menu</p>
          </div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-white font-medium shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-blue-500/30' : 'bg-transparent'
                  }`}>
                    <Icon size={17} />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full px-1 py-1.5 rounded-lg hover:bg-white/5"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
