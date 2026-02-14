import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { BarChart3, TrendingUp, Zap, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@manna.digital');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-10 animate-float" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">MarketPulse AI</h1>
                <p className="text-blue-300 text-sm">by Manna Digital</p>
              </div>
            </div>
            <p className="text-xl text-blue-100 leading-relaxed max-w-md">
              SEO & SEM Command Center untuk monitoring dan optimasi campaign Honda Indonesia.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: TrendingUp, title: 'Real-time Dashboard', desc: 'Monitor KPI campaign secara real-time' },
              { icon: Zap, title: 'AI-Powered Insights', desc: 'Analisis & rekomendasi otomatis dari AI' },
              { icon: Shield, title: 'Auto-Optimization', desc: 'Optimasi bid & budget secara otomatis' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 animate-fade-in">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{title}</h3>
                  <p className="text-blue-300/70 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-900 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MarketPulse AI</h1>
            </div>
            <p className="text-gray-500 text-sm">SEO & SEM Command Center</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                  placeholder="admin@manna.digital"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                  placeholder="Enter password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-600 font-semibold mb-1.5">Demo Credentials</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-500">admin@manna.digital</p>
                  <p className="text-xs text-blue-500">admin123</p>
                </div>
                <div className="text-xs text-blue-400 bg-blue-100 px-2 py-1 rounded-lg">Mock Mode</div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Manna Digital Agency &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
