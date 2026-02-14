import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Search, TrendingUp, Brain, Zap, FileText, Bell,
  Briefcase, Settings, ChevronRight, ChevronLeft, X, Rocket, CheckSquare,
  Square, PartyPopper,
} from 'lucide-react';

const STORAGE_KEY = 'mp_onboarding_done';

interface TourStep {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  tip?: string;
}

const tourSteps: TourStep[] = [
  {
    icon: Rocket,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    title: 'Welcome to MarketPulse AI!',
    description: 'Platform command center untuk manage, monitor, dan optimize semua campaign digital marketing kamu dari satu dashboard. Yuk kenalan sama fitur-fiturnya.',
    tip: 'Tour ini cuma muncul sekali. Kamu bisa skip kapan aja.',
  },
  {
    icon: LayoutDashboard,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    title: 'Dashboard',
    description: 'Overview semua KPI campaign dalam satu layar. Lihat progress target clicks, visits, conversions, dan cost harian. Real-time update setiap 30 detik via WebSocket.',
    tip: 'Klik campaign di header untuk switch antar campaign.',
  },
  {
    icon: Search,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    title: 'SEM (Search Engine Marketing)',
    description: 'Monitor performa Google Search Ads — keyword performance, Quality Score, CPC, CTR, dan bid optimization. Semua data keyword-level ada di sini.',
    tip: 'Klik keyword untuk lihat detail metrics per hari.',
  },
  {
    icon: TrendingUp,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    title: 'SEO (Organic Rankings)',
    description: 'Track ranking keyword organik, page audit scores, mobile performance, dan technical SEO issues. Pantau posisi keyword naik/turun setiap hari.',
    tip: 'Warna hijau = top 3, biru = top 10, abu = di bawah 10.',
  },
  {
    icon: Brain,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    title: 'AI Insights',
    description: 'Claude AI menganalisa data campaign dan kasih rekomendasi actionable — dari performance analysis sampai optimization suggestions. Klik "Apply" untuk langsung eksekusi.',
    tip: 'Klik "Refresh Analysis" untuk generate insights terbaru.',
  },
  {
    icon: Zap,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-100',
    title: 'Auto-Optimize',
    description: 'Set rules otomatis untuk optimize campaign. Misal: "Kalau CPC > Rp 2.000, turunkan bid 10%". Rules bisa dijadwalkan atau manual trigger.',
    tip: 'Lihat Action History untuk tracking semua perubahan otomatis.',
  },
  {
    icon: FileText,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    title: 'Reports',
    description: 'Generate report campaign (Weekly, Monthly, Full Campaign). Report bisa di-print langsung dari browser atau save as PDF untuk dikirim ke client.',
    tip: 'Klik "View Full Report" untuk lihat versi HTML lengkap.',
  },
  {
    icon: Bell,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-100',
    title: 'Alerts',
    description: 'Configurable alert rules — set threshold untuk metrics dan terima notifikasi kalau ada anomaly. Misal: alert kalau clicks turun di bawah target harian.',
    tip: 'Tab "Rules" untuk manage alert rules, "Events" untuk lihat triggered alerts.',
  },
  {
    icon: Briefcase,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
    title: 'Manage',
    description: 'Tambah client baru dan buat campaign dari sini. Set channels (Google, TikTok, IG, FB), KPI targets, dan budget — semua lewat form, tanpa perlu SQL.',
    tip: 'Campaign baru langsung muncul di dropdown selector di header.',
  },
  {
    icon: Settings,
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
    title: 'Settings',
    description: 'Profile settings, notification preferences, dan API integrations (Google Ads, Meta, TikTok, Claude AI). Connect real data sources kalau sudah ready.',
  },
  {
    icon: PartyPopper,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100',
    title: 'Kamu siap!',
    description: 'Itu dia semua fitur utama MarketPulse AI. Mulai dari Dashboard untuk lihat overview, atau langsung ke Manage untuk setup campaign baru. Happy optimizing!',
  },
];

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the UI renders first
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeTour = () => {
    setIsVisible(false);
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  const finishTour = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeTour} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={closeTour}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step counter */}
        <div className="absolute top-4 left-5 text-xs text-gray-400 font-medium">
          {currentStep + 1} / {tourSteps.length}
        </div>

        {/* Content */}
        <div className="px-6 pt-12 pb-6">
          {/* Icon */}
          <div className={`w-14 h-14 ${step.iconBg} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
            <Icon className={`w-7 h-7 ${step.iconColor}`} />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Tip */}
          {step.tip && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 mb-4">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> {step.tip}
              </p>
            </div>
          )}

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 mb-6">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-blue-500'
                    : idx < currentStep
                    ? 'w-1.5 bg-blue-300'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Left side: don't show again */}
            <button
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {dontShowAgain
                ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                : <Square className="w-3.5 h-3.5" />
              }
              Jangan tampilkan lagi
            </button>

            {/* Right side: nav buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              {isFirst && (
                <button
                  onClick={closeTour}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                onClick={nextStep}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {isLast ? 'Mulai!' : 'Next'}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a function to reset the tour (for Settings page or testing)
export function resetOnboardingTour() {
  localStorage.removeItem(STORAGE_KEY);
}
