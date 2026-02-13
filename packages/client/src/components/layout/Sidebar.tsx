import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, TrendingUp, FileText, Bell, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sem', icon: Search, label: 'SEM' },
  { to: '/seo', icon: TrendingUp, label: 'SEO' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { logout, user } = useAuthStore();

  return (
    <aside className="w-64 bg-brand-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">MarketPulse AI</h1>
        <p className="text-xs text-blue-300 mt-1">SEO & SEM Command Center</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white border-r-2 border-blue-400'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
