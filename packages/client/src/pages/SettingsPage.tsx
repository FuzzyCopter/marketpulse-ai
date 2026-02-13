import { useAuthStore } from '../store/auth.store';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile</h3>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Name</label>
            <p className="font-medium">{user?.fullName}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Role</label>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Tenant ID</label>
            <p className="font-medium">{user?.tenantId}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System</h3>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Data Source</label>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Mock</span>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Version</label>
            <p className="font-medium">1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
