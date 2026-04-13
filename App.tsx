
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { PrayerCard } from './components/PrayerCard';
import { QuickActions } from './components/QuickActions';
import { PrayerList } from './components/PrayerList';
import { AnalyticsPage } from './components/AnalyticsPage';
import { BottomNav } from './components/BottomNav';
import { TasbihModal } from './components/TasbihModal';
import { QiblaFinder } from './components/QiblaFinder';
import { QadaTracker } from './components/QadaTracker';
import { LecturesPage } from './components/LecturesPage';
import { ProfilePage } from './components/ProfilePage';
import { DailyDuaWidget } from './components/DailyDuaWidget';
import { PrayerDetailModal } from './components/PrayerDetailModal';
import { RakibSystem } from './components/RakibSystem';
import { DuaPage } from './components/DuaPage';
import { QuranReader } from './components/QuranReader';
import { GuidedTour, TourStep } from './components/GuidedTour';

import { NotificationPermission } from './components/NotificationPermission';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { onboardingService } from './services/OnboardingService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MOCK_USER, INITIAL_PRAYERS, MOCK_QADA } from './constants';
import { Prayer, PrayerStatus, ActionId, HeartCondition } from './types';
import { Sparkles } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { InviteService, InviteType } from './services/InviteService';
import { FamilyService } from './services/FamilyService';
import { SuhbaService } from './services/SuhbaService';
import { PartnerService } from './services/PartnerService';
import { useAuth } from './hooks/useAuth';
import { AdhanProvider, useAdhan } from './contexts/AdhanContext';
import { AdhanManager } from './components/AdhanManager';
import { AdhanOverlay } from './components/AdhanOverlay';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useNotificationListener } from './hooks/useNotificationListener';

const AppContent: React.FC = () => {
  console.error('[App] AppContent Rendering');
  // State management
  const [prayers, setPrayers] = useState<Prayer[]>(() => {
    const saved = localStorage.getItem('muslimDaily_prayers');
    return saved ? JSON.parse(saved) : INITIAL_PRAYERS;
  });

  const [user, setUser] = useState(MOCK_USER);

  // UI State
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isTourOpen, setIsTourOpen] = useState(false);

  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !onboardingService.isOnboardingComplete());

  const { isAuthenticated, user: authUser } = useAuth();
  const { state: adhanState, dismissAdhan, triggerTestAdhan } = useAdhan();

  // Listen for real-time partner/family/suhba notifications
  const { notifications: inAppNotifications, unreadCount: notificationCount } = useNotificationListener();

  console.error('[App] AppContent useAdhan hook result:', {
    hasTrigger: !!triggerTestAdhan,
    adhanStateOfType: typeof adhanState,
    state: adhanState
  });

  // Handler for Adhan reminder
  const handleAdhanRemind = (target: 'partner' | 'family' | 'circle') => {
    console.log(`[App] Remind ${target} about prayer`);
    // TODO: Integrate with PartnerService, FamilyService, or SuhbaService
    alert(`Reminder sent to ${target}!`);
    dismissAdhan();
  };

  // Prayer times data for PrayerCard
  const prayerData = usePrayerTimes();

  // Listen for test adhan event from ProfilePage
  useEffect(() => {
    const handleTestAdhan = () => {
      triggerTestAdhan();
    };
    window.addEventListener('testAdhan', handleTestAdhan);
    return () => window.removeEventListener('testAdhan', handleTestAdhan);
  }, [triggerTestAdhan]);

  // Trigger onboarding after first-time authentication
  useEffect(() => {
    if (isAuthenticated && !onboardingService.isOnboardingComplete()) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated]);

  const { t, dir } = useLanguage();

  // Swipe Navigation Refs
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const touchEndRef = useRef<{ x: number, y: number } | null>(null);
  // Added 'quran' to the main tabs
  const MAIN_TABS = ['home', 'partners', 'quran', 'lectures', 'stats', 'profile'];

  // References for scrolling
  const qadaRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('muslimDaily_prayers', JSON.stringify(prayers));
  }, [prayers]);

  // Deep Link Handler for Native App
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        const parsedUrl = new URL(url);
        // Check if it's a join link: /join/{type}/{code}
        if (parsedUrl.pathname.startsWith('/join/')) {
          const parts = parsedUrl.pathname.split('/');
          const type = parts[2] as InviteType;
          const code = parts[3];

          if (type && code) {
            // Store pending invite
            InviteService.savePendingInvite({
              type,
              code,
              timestamp: Date.now()
            });
            // Navigate to partners tab
            setActiveTab('partners');
          }
        }
      } catch (e) {
        console.error('Failed to handle deep link:', e);
      }
    };

    // Listen for app URL open events
    CapacitorApp.addListener('appUrlOpen', (event) => {
      handleDeepLink(event.url);
    });

    // Check for pending invite on app load
    const pendingInvite = InviteService.getPendingInvite();
    if (pendingInvite) {
      setActiveTab('partners');
    }

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  // Handlers
  const updatePrayer = (id: string, updates: Partial<Prayer>) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleHeartStateSelect = (state: HeartCondition) => {
    setUser({ ...user, currentHeartState: state });
  };

  const handleQuickAction = (id: ActionId) => {
    switch (id) {
      case 'tasbih':
        setIsTasbihOpen(true);
        break;
      case 'qibla':
        setIsQiblaOpen(true);
        break;
      case 'dua':
        setActiveTab('dua');
        break;
      case 'partners':
        setActiveTab('partners');
        break;
      case 'qada':
        if (activeTab === 'home') {
          qadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setActiveTab('home');
          setTimeout(() => qadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
        break;
      case 'settings':
        setActiveTab('profile');
        break;
      case 'goals':
        setActiveTab('stats');
        break;
      case 'lectures': // Renamed from 'quran' in QuickActions initially to lectures, but now we have a real Quran tab
        setActiveTab('quran');
        break;
      default:
        console.log(`Action ${id} clicked`);
    }
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = touchStartRef.current.y - touchEndRef.current.y;
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);
    const minDistance = 50; // Minimum swipe distance in px

    if (isHorizontal && Math.abs(distanceX) > minDistance) {
      const currentIndex = MAIN_TABS.indexOf(activeTab);
      if (currentIndex === -1) return; // Don't swipe if on a sub-page like 'dua'

      const isLeftSwipe = distanceX > 0;
      const isRightSwipe = distanceX < 0;

      if (dir === 'rtl') {
        // RTL Logic: Swipe Right (negative X) -> Next, Swipe Left (positive X) -> Prev
        if (isRightSwipe && currentIndex < MAIN_TABS.length - 1) {
          setActiveTab(MAIN_TABS[currentIndex + 1]);
        } else if (isLeftSwipe && currentIndex > 0) {
          setActiveTab(MAIN_TABS[currentIndex - 1]);
        }
      } else {
        // LTR Logic: Swipe Left (positive X) -> Next, Swipe Right (negative X) -> Prev
        if (isLeftSwipe && currentIndex < MAIN_TABS.length - 1) {
          setActiveTab(MAIN_TABS[currentIndex + 1]);
        } else if (isRightSwipe && currentIndex > 0) {
          setActiveTab(MAIN_TABS[currentIndex - 1]);
        }
      }
    }
  };

  // TOUR CONFIGURATION
  const currentTourSteps: TourStep[] = useMemo(() => {
    const tours: Record<string, TourStep[]> = {
      'home': [
        { targetId: 'app-header', title: t('tour_home_profile_title'), content: t('tour_home_profile_content') },
        { targetId: 'hero-section', title: t('tour_home_hero_title'), content: t('tour_home_hero_content') },
        { targetId: 'next-prayer-card', title: t('tour_home_next_title'), content: t('tour_home_next_content') },
        { targetId: 'quick-actions', title: t('tour_home_quick_title'), content: t('tour_home_quick_content') },
        { targetId: 'prayer-list', title: t('tour_home_list_title'), content: t('tour_home_list_content') },
        { targetId: 'bottom-nav', title: t('tour_home_nav_title'), content: t('tour_home_nav_content') },
      ],
      'dua': [
        { targetId: 'dua-search', title: t('tour_dua_search_title'), content: t('tour_dua_search_content') },
        { targetId: 'dua-category-first', title: t('tour_dua_cat_title'), content: t('tour_dua_cat_content') },
      ],
      'partners': [
        { targetId: 'partner-add-btn', title: t('tour_partners_add_title'), content: t('tour_partners_add_content') },
        { targetId: 'partner-groups', title: t('tour_partners_group_title'), content: t('tour_partners_group_content') },
      ],
      'stats': [
        { targetId: 'analytics-streak', title: t('tour_stats_streak_title'), content: t('tour_stats_streak_content') },
        { targetId: 'analytics-weakness', title: t('tour_stats_insights_title'), content: t('tour_stats_insights_content') },
      ],
      'lectures': [
        { targetId: 'lectures-featured', title: t('tour_lectures_featured_title'), content: t('tour_lectures_featured_content') },
        { targetId: 'lecture-card-first', title: t('tour_lectures_lib_title'), content: t('tour_lectures_lib_content') },
      ],
      'profile': [
        { targetId: 'profile-user-card', title: t('tour_profile_id_title'), content: t('tour_profile_id_content') },
        { targetId: 'profile-settings-first', title: t('tour_profile_settings_title'), content: t('tour_profile_settings_content') },
      ]
    };
    return tours[activeTab] || [];
  }, [activeTab, t]);

  // Manual test wrapper
  const handleManualTest = () => {
    console.error('[App] Manual Test Triggered. Hook result:', {
      hasTrigger: !!triggerTestAdhan,
      triggerType: typeof triggerTestAdhan,
      //state: adhanState
    });

    if (typeof triggerTestAdhan === 'function') {
      try {
        triggerTestAdhan();
      } catch (err) {
        console.error('[App] Error calling triggerTestAdhan:', err);
      }
    } else {
      console.error('[App] CRITICAL: triggerTestAdhan is NOT a function!', triggerTestAdhan);
    }
  };

  const nextPrayer = prayers.find(p => p.isNext) || prayers[0];

  const renderContent = () => {
    switch (activeTab) {
      case 'dua':
        return <DuaPage onBack={() => setActiveTab('home')} onHelp={() => setIsTourOpen(true)} />;
      case 'quran':
        return <QuranReader />;
      case 'partners':
        return <RakibSystem />;
      case 'lectures':
        return <LecturesPage />;
      case 'profile':
        return <ProfilePage user={user} onTestAdhan={handleManualTest} />;
      case 'stats':
        return <AnalyticsPage prayers={prayers} />;
      case 'home':
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <PrayerCard prayerData={prayerData} />
            <DailyDuaWidget />
            <QuickActions onActionClick={handleQuickAction} />
            <PrayerList
              prayers={prayers}
              onPrayerClick={(p) => setSelectedPrayer(p)}
            />
            <div ref={qadaRef}>
              <QadaTracker stats={MOCK_QADA} />
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-screen bg-neutral-body text-neutral-primary font-sans pb-20"
      dir={dir}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Splash Screen Layer */}
      {/* Onboarding Flow for first-time users */}
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Adhan Overlay - Full screen prayer alert */}
      <AdhanManager />
      {/* Debug Logging */}
      {(() => {
        useEffect(() => {
          console.error('[App] adhanState changed EFFECT:', adhanState);
        }, [adhanState]);
        return null;
      })()}
      <AdhanOverlay
        isOpen={adhanState.isActive}
        prayerName={adhanState.prayerName}
        prayerNameAr={adhanState.prayerNameAr}
        onClose={dismissAdhan}
        onRemind={handleAdhanRemind}
      />

      <div className="max-w-md mx-auto bg-neutral-body min-h-screen relative shadow-2xl shadow-black/5 overflow-hidden">

        {/* Conditional Header: We hide the main header for specific immersive pages like Quran/Dua */}
        <div className="px-5 pt-safe-top space-y-1">
          {!['dua', 'quran'].includes(activeTab) && (
            <Header user={user} />
          )}

          <main className={['dua', 'quran'].includes(activeTab) ? 'pt-0 -mx-5' : 'pt-2 pb-10'}>
            {renderContent()}
          </main>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Global Floating Help Button - Hidden on Reader pages to avoid clutter */}
        {activeTab !== 'quran' && (
          <button
            onClick={() => setIsTourOpen(true)}
            className="fixed bottom-24 right-5 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-brand-forest to-brand-teal text-white shadow-lg shadow-brand-forest/40 flex items-center justify-center animate-pulse active:scale-90 transition-transform rtl:right-auto rtl:left-5"
            aria-label="Start Tour"
          >
            <Sparkles size={22} className="fill-white/20" />
          </button>
        )}

        <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
        <QiblaFinder isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />

        <PrayerDetailModal
          isOpen={!!selectedPrayer}
          prayer={selectedPrayer}
          onClose={() => setSelectedPrayer(null)}
          onSave={updatePrayer}
        />

        <GuidedTour
          isOpen={isTourOpen}
          steps={currentTourSteps}
          onClose={() => setIsTourOpen(false)}
        />

        {/* Notification Permission Prompt */}
        {showNotificationPrompt && (
          <NotificationPermission onComplete={() => setShowNotificationPrompt(false)} />
        )}

      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AdhanProvider>
        <AppContent />
      </AdhanProvider>
    </LanguageProvider>
  );
};

export default App;
