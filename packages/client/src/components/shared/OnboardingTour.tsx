import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, X, Rocket, CheckSquare,
  Square, PartyPopper, MousePointerClick,
} from 'lucide-react';

const STORAGE_KEY = 'mp_onboarding_done';

interface TourStep {
  route: string;          // Page to navigate to
  target?: string;        // data-tour attribute value to spotlight
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string;        // Instruction text for the user
}

const tourSteps: TourStep[] = [
  {
    route: '/',
    title: 'Selamat datang di MarketPulse AI!',
    description: 'Yuk kenalan sama semua fitur platform ini. Kita akan jalan-jalan ke setiap halaman dan lihat apa aja yang bisa kamu lakuin.',
    position: 'center',
    action: 'Klik Next untuk mulai tour',
  },
  {
    route: '/',
    target: 'campaign-selector',
    title: 'Campaign Selector',
    description: 'Di sini kamu bisa switch antar campaign. Semua data di dashboard, SEM, SEO, dll akan berubah sesuai campaign yang dipilih.',
    position: 'bottom',
    action: 'Ini dropdown untuk pilih campaign aktif',
  },
  {
    route: '/',
    target: 'quick-metrics',
    title: "Today's Metrics",
    description: 'Impressions, Clicks, Visits, dan Cost hari ini. Data update real-time setiap 30 detik via WebSocket.',
    position: 'bottom',
    action: 'Metrics harian campaign kamu',
  },
  {
    route: '/',
    target: 'kpi-section',
    title: 'KPI Progress',
    description: 'Tracking progress KPI vs target. Hijau = on track, merah = behind. Ada projected total berdasarkan pace saat ini.',
    position: 'top',
    action: 'Monitor apakah campaign on track atau behind',
  },
  {
    route: '/sem',
    target: 'sem-keywords',
    title: 'SEM - Keywords',
    description: 'Data keyword Google Search Ads — Quality Score, Match Type, Max CPC, dan status. Sort by klik header kolom.',
    position: 'top',
    action: 'Halaman SEM untuk monitor Google Search Ads',
  },
  {
    route: '/seo',
    target: 'seo-rankings',
    title: 'SEO - Keyword Rankings',
    description: 'Ranking keyword organik di Google. Hijau = top 3, biru = top 10. Panah atas/bawah menunjukkan perubahan posisi.',
    position: 'top',
    action: 'Halaman SEO untuk tracking organic rankings',
  },
  {
    route: '/ai-insights',
    target: 'ai-refresh',
    title: 'AI Insights - Refresh',
    description: 'Klik tombol ini untuk minta Claude AI menganalisa data campaign terbaru. Hasilnya muncul di bawah — ada Performance Analysis dan Optimization Suggestions.',
    position: 'bottom',
    action: 'Klik Refresh Analysis untuk generate AI insights baru',
  },
  {
    route: '/reports',
    target: 'report-generator',
    title: 'Generate Report',
    description: 'Pilih tipe report (Weekly, Monthly, Full Campaign), lalu klik Generate. Report bisa di-print atau save as PDF langsung dari browser.',
    position: 'bottom',
    action: 'Buat report campaign dari sini',
  },
  {
    route: '/alerts',
    target: 'alert-tabs',
    title: 'Alerts System',
    description: 'Tab "Events" untuk lihat alert yang sudah trigger. Tab "Rules" untuk set threshold — misal alert kalau CPC > Rp 2.000. Klik "Check Now" untuk evaluasi manual.',
    position: 'bottom',
    action: 'Monitor dan manage alert rules',
  },
  {
    route: '/manage',
    target: 'manage-new',
    title: 'Manage - New Campaign',
    description: 'Tambah client baru dan buat campaign dari sini. Pilih channels, set KPI target & budget per channel. Campaign langsung muncul di selector.',
    position: 'bottom',
    action: 'Klik tombol ini kalau mau bikin campaign baru',
  },
  {
    route: '/',
    title: 'Tour selesai!',
    description: 'Kamu sudah kenal semua fitur utama MarketPulse AI. Mulai explore dari Dashboard, atau langsung ke Manage untuk setup campaign baru. Happy optimizing!',
    position: 'center',
    action: 'Klik Selesai untuk mulai pakai MarketPulse',
  },
];

export default function OnboardingTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Find and highlight the target element
  const updateSpotlight = useCallback(() => {
    const step = tourSteps[currentStep];
    if (!step.target || step.position === 'center') {
      setSpotlight(null);
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      // Element not found yet, retry
      rafRef.current = requestAnimationFrame(() => {
        setTimeout(updateSpotlight, 200);
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    setSpotlight(rect);

    // Position tooltip relative to spotlight
    const pad = 16;
    const tooltipW = Math.min(380, window.innerWidth - 32);
    const pos = step.position || 'bottom';

    let style: React.CSSProperties = { position: 'fixed', width: tooltipW };

    if (pos === 'bottom') {
      style.top = rect.bottom + pad;
      style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16));
    } else if (pos === 'top') {
      style.bottom = window.innerHeight - rect.top + pad;
      style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16));
    } else if (pos === 'right') {
      style.top = rect.top + rect.height / 2 - 80;
      style.left = rect.right + pad;
    } else if (pos === 'left') {
      style.top = rect.top + rect.height / 2 - 80;
      style.right = window.innerWidth - rect.left + pad;
    }

    // Clamp vertically
    if (style.top && typeof style.top === 'number') {
      style.top = Math.max(16, Math.min(style.top, window.innerHeight - 250));
    }

    setTooltipStyle(style);
  }, [currentStep]);

  // Navigate and spotlight on step change
  useEffect(() => {
    if (!isVisible) return;

    const step = tourSteps[currentStep];

    // Navigate to correct route if needed
    if (location.pathname !== step.route) {
      navigate(step.route);
      // Wait for page to render
      const timer = setTimeout(updateSpotlight, 600);
      return () => clearTimeout(timer);
    }

    // Small delay for DOM settle
    const timer = setTimeout(updateSpotlight, 300);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [currentStep, isVisible, location.pathname, navigate, updateSpotlight]);

  // Update on resize/scroll
  useEffect(() => {
    if (!isVisible) return;

    const handler = () => updateSpotlight();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isVisible, updateSpotlight]);

  const closeTour = () => {
    setIsVisible(false);
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    navigate('/');
  };

  const finishTour = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    navigate('/');
  };

  const goToStep = (idx: number) => {
    setSpotlight(null);
    setCurrentStep(idx);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;
  const isCenter = step.position === 'center' || !step.target;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
      {/* Overlay with spotlight hole */}
      {isCenter ? (
        // Full overlay for center modals
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
          style={{ pointerEvents: 'auto' }}
          onClick={closeTour}
        />
      ) : spotlight ? (
        // Spotlight overlay using box-shadow trick
        <>
          <div
            className="absolute inset-0"
            style={{ pointerEvents: 'auto' }}
            onClick={closeTour}
          />
          <div
            className="absolute transition-all duration-500 ease-out rounded-xl"
            style={{
              top: spotlight.top - 6,
              left: spotlight.left - 6,
              width: spotlight.width + 12,
              height: spotlight.height + 12,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none',
            }}
          />
          {/* Pulse ring around spotlight */}
          <div
            className="absolute rounded-xl border-2 border-blue-400 animate-pulse"
            style={{
              top: spotlight.top - 8,
              left: spotlight.left - 8,
              width: spotlight.width + 16,
              height: spotlight.height + 16,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        // Loading state
        <div
          className="absolute inset-0 bg-black/40"
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Tooltip / Card */}
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
        style={{
          ...tooltipStyle,
          pointerEvents: 'auto',
          zIndex: 101,
          maxWidth: isCenter ? 460 : 380,
          width: isCenter ? '90vw' : tooltipStyle.width,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {currentStep + 1}/{tourSteps.length}
              </span>
              {step.action && !isCenter && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <MousePointerClick className="w-3 h-3" />
                  {step.action}
                </span>
              )}
            </div>
            <button
              onClick={closeTour}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Center mode icons */}
          {isCenter && (
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto ${
              isFirst ? 'bg-blue-100' : 'bg-amber-100'
            }`}>
              {isFirst
                ? <Rocket className="w-7 h-7 text-blue-600" />
                : <PartyPopper className="w-7 h-7 text-amber-500" />
              }
            </div>
          )}

          {/* Title */}
          <h3 className={`text-lg font-bold text-gray-900 mb-2 ${isCenter ? 'text-center' : ''}`}>
            {step.title}
          </h3>

          {/* Description */}
          <p className={`text-sm text-gray-600 leading-relaxed mb-4 ${isCenter ? 'text-center' : ''}`}>
            {step.description}
          </p>

          {/* Step dots */}
          <div className="flex justify-center gap-1 mb-4">
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-5 bg-blue-500'
                    : idx < currentStep
                    ? 'w-1.5 bg-blue-300'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
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

            <div className="flex items-center gap-2">
              {isFirst ? (
                <button
                  onClick={closeTour}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip
                </button>
              ) : (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {isLast ? 'Selesai!' : 'Next'}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function resetOnboardingTour() {
  localStorage.removeItem(STORAGE_KEY);
}
