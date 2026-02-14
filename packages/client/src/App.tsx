import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useCampaignStore } from './store/campaign.store';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SEMPage from './pages/SEMPage';
import SEOPage from './pages/SEOPage';
import ReportsPage from './pages/ReportsPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import AIInsightsPage from './pages/AIInsightsPage';
import AutoOptimizePage from './pages/AutoOptimizePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppInit({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { fetchCampaigns } = useCampaignStore();

  useEffect(() => {
    const token = localStorage.getItem('mp_access_token');
    if (token) {
      checkAuth();
    } else {
      // No token — skip API call, just mark as not loading
      useAuthStore.setState({ isLoading: false });
    }
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchCampaigns();
    }
  }, [isAuthenticated, isLoading, fetchCampaigns]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit>
        <Routes>
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sem" element={<SEMPage />} />
            <Route path="/seo" element={<SEOPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/ai-insights" element={<AIInsightsPage />} />
            <Route path="/auto-optimize" element={<AutoOptimizePage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInit>
    </BrowserRouter>
  );
}
