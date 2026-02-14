import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, X, Rocket, CheckSquare,
  Square, PartyPopper, MousePointerClick,
} from 'lucide-react';

const STORAGE_KEY = 'mp_onboarding_done';

interface TourStep {
  route: string;
  target?: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string;
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
    description: 'Switch antar campaign di sini. Semua data di dashboard, SEM, SEO akan berubah sesuai campaign yang dipilih.',
    position: 'bottom',
    action: 'Dropdown untuk pilih campaign aktif',
  },
  {
    route: '/',
    target: 'quick-metrics',
    title: "Today's Metrics",
    description: 'Impressions, Clicks, Visits, dan Cost hari ini. Real-time update setiap 30 detik.',
    position: 'bottom',
    action: 'Metrics harian campaign kamu',
  },
  {
    route: '/',
    target: 'kpi-section',
    title: 'KPI Progress',
    description: 'Progress KPI vs target. Hijau = on track, merah = behind. Ada projected total berdasarkan pace saat ini.',
    position: 'top',
    action: 'Campaign on track atau behind',
  },
  {
    route: '/sem',
    target: 'sem-keywords',
    title: 'SEM - Keywords',
    description: 'Data keyword Google Search Ads — Quality Score, Match Type, CPC, dan status.',
    position: 'top',
    action: 'Monitor Google Search Ads',
  },
  {
    route: '/seo',
    target: 'seo-rankings',
    title: 'SEO - Keyword Rankings',
    description: 'Ranking keyword organik. Hijau = top 3, biru = top 10. Panah menunjukkan perubahan posisi.',
    position: 'top',
    action: 'Tracking organic rankings',
  },
  {
    route: '/ai-insights',
    target: 'ai-refresh',
    title: 'AI Insights',
    description: 'Klik Refresh Analysis untuk minta Claude AI analisa data campaign. Ada Performance Analysis & Optimization Suggestions.',
    position: 'bottom',
    action: 'Generate AI insights baru',
  },
  {
    route: '/reports',
    target: 'report-generator',
    title: 'Generate Report',
    description: 'Pilih tipe report (Weekly/Monthly/Full), lalu Generate. Bisa print atau save as PDF langsung dari browser.',
    position: 'bottom',
    action: 'Buat report campaign',
  },
  {
    route: '/alerts',
    target: 'alert-tabs',
    title: 'Alerts System',
    description: '"Events" = triggered alerts. "Rules" = set threshold. Misal alert kalau CPC > Rp 2.000.',
    position: 'bottom',
    action: 'Manage alert rules',
  },
  {
    route: '/manage',
    target: 'manage-new',
    title: 'Manage - New Campaign',
    description: 'Tambah client & campaign baru. Set channels, KPI target, budget. Campaign langsung muncul di selector.',
    position: 'bottom',
    action: 'Bikin campaign baru dari sini',
  },
  {
    route: '/',
    title: 'Tour selesai!',
    description: 'Kamu sudah kenal semua fitur MarketPulse AI. Mulai dari Dashboard atau langsung ke Manage untuk setup campaign baru!',
    position: 'center',
    action: 'Klik Selesai untuk mulai pakai MarketPulse',
  },
];

function isMobile() {
  return window.innerWidth < 768;
}

export default function OnboardingTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [mobile, setMobile] = useState(isMobile());
  const retryRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Track mobile state
  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const updateSpotlight = useCallback(() => {
    if (retryRef.current) clearTimeout(retryRef.current);

    const step = tourSteps[currentStep];
    const isCenter = step.position === 'center' || !step.target;

    if (isCenter) {
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
      retryRef.current = setTimeout(updateSpotlight, 250);
      return;
    }

    // Scroll element into view first
    const mainContent = document.querySelector('main');
    if (mainContent) {
      const elRect = el.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      // If element is below visible area or above it, scroll
      if (elRect.top < mainRect.top || elRect.bottom > mainRect.bottom - (mobile ? 220 : 0)) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Re-calculate after scroll
        retryRef.current = setTimeout(updateSpotlight, 400);
        return;
      }
    }

    const rect = el.getBoundingClientRect();

    // On mobile, limit spotlight height to not cover entire screen
    const maxSpotlightH = mobile ? Math.min(rect.height, window.innerHeight * 0.4) : rect.height;
    const clampedRect = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: maxSpotlightH,
      bottom: rect.top + maxSpotlightH,
      right: rect.right,
    };

    setSpotlight(clampedRect as DOMRect);

    // ── MOBILE: bottom sheet ───────────────────────────
    if (mobile) {
      setTooltipStyle({
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        borderRadius: '16px 16px 0 0',
      });
      return;
    }

    // ── DESKTOP: float next to element ─────────────────
    const pad = 16;
    const tooltipW = Math.min(380, window.innerWidth - 32);
    const pos = step.position || 'bottom';
    const style: React.CSSProperties = { position: 'fixed', width: tooltipW };

    if (pos === 'bottom') {
      const proposedTop = clampedRect.bottom + pad;
      // If tooltip would go off-screen bottom, flip to top
      if (proposedTop + 240 > window.innerHeight) {
        style.bottom = window.innerHeight - clampedRect.top + pad;
      } else {
        style.top = proposedTop;
      }
      style.left = Math.max(16, Math.min(
        clampedRect.left + clampedRect.width / 2 - tooltipW / 2,
        window.innerWidth - tooltipW - 16
      ));
    } else if (pos === 'top') {
      const proposedBottom = window.innerHeight - clampedRect.top + pad;
      // If tooltip would go off-screen top, flip to bottom
      if (clampedRect.top - pad - 240 < 0) {
        style.top = clampedRect.bottom + pad;
      } else {
        style.bottom = proposedBottom;
      }
      style.left = Math.max(16, Math.min(
        clampedRect.left + clampedRect.width / 2 - tooltipW / 2,
        window.innerWidth - tooltipW - 16
      ));
    } else if (pos === 'right') {
      style.top = Math.max(16, clampedRect.top + clampedRect.height / 2 - 80);
      style.left = Math.min(clampedRect.right + pad, window.innerWidth - tooltipW - 16);
    } else if (pos === 'left') {
      style.top = Math.max(16, clampedRect.top + clampedRect.height / 2 - 80);
      style.right = Math.max(16, window.innerWidth - clampedRect.left + pad);
    }

    // Final vertical clamp
    if (typeof style.top === 'number') {
      style.top = Math.max(16, Math.min(style.top, window.innerHeight - 260));
    }

    setTooltipStyle(style);
  }, [currentStep, mobile]);

  // Navigate and spotlight on step change
  useEffect(() => {
    if (!isVisible) return;
    const step = tourSteps[currentStep];

    if (location.pathname !== step.route) {
      navigate(step.route);
      const timer = setTimeout(updateSpotlight, 700);
      return () => clearTimeout(timer);
    }

    // Scroll to top on new page
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.scrollTop = 0;

    const timer = setTimeout(updateSpotlight, 350);
    return () => {
      clearTimeout(timer);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [currentStep, isVisible, location.pathname, navigate, updateSpotlight]);

  // Update on resize/scroll
  useEffect(() => {
    if (!isVisible) return;
    const handler = () => updateSpotlight();
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [isVisible, updateSpotlight]);

  const closeTour = () => {
    setIsVisible(false);
    if (dontShowAgain) localStorage.setItem(STORAGE_KEY, 'true');
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
    if (currentStep < tourSteps.length - 1) goToStep(currentStep + 1);
    else finishTour();
  };

  const prevStep = () => {
    if (currentStep > 0) goToStep(currentStep - 1);
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;
  const isCenter = step.position === 'center' || !step.target;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
      {/* Overlay */}
      {isCenter ? (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={{ pointerEvents: 'auto' }}
          onClick={closeTour}
        />
      ) : spotlight ? (
        <>
          <div
            className="absolute inset-0"
            style={{ pointerEvents: 'auto' }}
            onClick={closeTour}
          />
          {/* Spotlight hole */}
          <div
            className="absolute transition-all duration-500 ease-out rounded-xl"
            style={{
              top: spotlight.top - 6,
              left: spotlight.left - 6,
              width: spotlight.width + 12,
              height: spotlight.height + 12,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              pointerEvents: 'none',
            }}
          />
          {/* Pulse ring */}
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
        <div className="absolute inset-0 bg-black/40" style={{ pointerEvents: 'auto' }} />
      )}

      {/* Tooltip Card */}
      <div
        className={`bg-white shadow-2xl overflow-hidden ${
          mobile && !isCenter ? 'rounded-t-2xl' : 'rounded-2xl'
        }`}
        style={{
          ...tooltipStyle,
          pointerEvents: 'auto',
          zIndex: 101,
          maxWidth: isCenter ? (mobile ? '92vw' : 440) : (mobile ? '100%' : 380),
          width: isCenter ? (mobile ? '92vw' : undefined) : tooltipStyle.width,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Mobile drag indicator */}
        {mobile && !isCenter && (
          <div className="flex justify-center pt-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        <div className={`${mobile ? 'px-4 pt-3 pb-4' : 'p-5'}`}>
          {/* Header row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                {currentStep + 1}/{tourSteps.length}
              </span>
              {step.action && !isCenter && (
                <span className="flex items-center gap-1 text-[11px] text-amber-600 leading-tight">
                  <MousePointerClick className="w-3 h-3 shrink-0" />
                  <span className="line-clamp-1">{step.action}</span>
                </span>
              )}
            </div>
            <button
              onClick={closeTour}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Center icons */}
          {isCenter && (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto ${
              isFirst ? 'bg-blue-100' : 'bg-amber-100'
            }`}>
              {isFirst
                ? <Rocket className="w-6 h-6 text-blue-600" />
                : <PartyPopper className="w-6 h-6 text-amber-500" />
              }
            </div>
          )}

          {/* Title */}
          <h3 className={`font-bold text-gray-900 mb-1.5 ${isCenter ? 'text-center text-lg' : 'text-base'}`}>
            {step.title}
          </h3>

          {/* Description */}
          <p className={`text-sm text-gray-600 leading-relaxed mb-3 ${isCenter ? 'text-center' : ''}`}>
            {step.description}
          </p>

          {/* Step dots */}
          <div className="flex justify-center gap-1 mb-3">
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
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              {dontShowAgain
                ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                : <Square className="w-3.5 h-3.5" />
              }
              <span className="hidden sm:inline">Jangan tampilkan lagi</span>
              <span className="sm:hidden">Skip forever</span>
            </button>

            <div className="flex items-center gap-1.5">
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
                  className="flex items-center gap-0.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
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

        {/* Safe area padding for iPhones */}
        {mobile && !isCenter && (
          <div className="h-[env(safe-area-inset-bottom)]" />
        )}
      </div>
    </div>
  );
}

export function resetOnboardingTour() {
  localStorage.removeItem(STORAGE_KEY);
}
