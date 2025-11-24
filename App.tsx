
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
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
import { HeartStateWidget } from './components/HeartStateWidget';
import { PrayerDetailModal } from './components/PrayerDetailModal';
import { RakibSystem } from './components/RakibSystem';
import { DuaPage } from './components/DuaPage';
import { QuranReader } from './components/QuranReader'; 
import { HabitTracker } from './components/HabitTracker';
import { GuidedTour, TourStep } from './components/GuidedTour';
import { SplashScreen } from './components/SplashScreen';
import { MurshidChat } from './components/MurshidChat'; // New Import
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext'; // Import ThemeProvider
import { MOCK_USER, INITIAL_PRAYERS, MOCK_QADA } from './constants';
import { Prayer, PrayerStatus, ActionId, HeartCondition } from './types';
import { Sparkles, Loader2, MessageCircle } from 'lucide-react';
import { fetchPrayerTimes } from './services/prayerService';

const AppContent: React.FC = () => {
  // State management
  const [prayers, setPrayers] = useState<Prayer[]>(() => {
    const saved = localStorage.getItem('muslimDaily_prayers');
    return saved ? JSON.parse(saved) : INITIAL_PRAYERS;
  });
  
  const [user, setUser] = useState(MOCK_USER);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // UI State
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isMurshidOpen, setIsMurshidOpen] = useState(false); // Chat State
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const { t, dir } = useLanguage();

  // Swipe Navigation Refs
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const touchEndRef = useRef<{x: number, y: number} | null>(null);
  // Added 'quran' to the main tabs
  const MAIN_TABS = ['home', 'partners', 'quran', 'lectures', 'stats', 'profile'];

  // References for scrolling
  const qadaRef = useRef<HTMLDivElement>(null);

  // Initialize Real Data
  useEffect(() => {
    const initData = async () => {
      // Check if we have fresh data for today
      const lastFetchDate = localStorage.getItem('muslimDaily_lastFetchDate');
      const todayStr = new Date().toDateString();

      if (lastFetchDate !== todayStr) {
        setLoadingLocation(true);
        // Default Coordinates (Mecca) if geolocation fails
        let lat = 21.4225;
        let long = 39.8262;

        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            lat = position.coords.latitude;
            long = position.coords.longitude;
          } catch (e) {
            console.log("Geolocation failed, using default.");
          }
        }

        const data = await fetchPrayerTimes(lat, long);
        if (data) {
          // Merge new times with existing status if possible, or reset status
          // For simplicity, we reset status if it's a new day, but in a real app we'd check DB
          setPrayers(data.prayers);
          setUser(prev => ({
             ...prev,
             hijriDate: data.hijriDate,
             location: data.locationName // Ideally reverse geocode this
          }));
          localStorage.setItem('muslimDaily_lastFetchDate', todayStr);
        }
        setLoadingLocation(false);
      }
    };

    initData();
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('muslimDaily_prayers', JSON.stringify(prayers));
  }, [prayers]);

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
      case 'habits':
        setActiveTab('habits');
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
      case 'lectures': 
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
    const minDistance = 50; 

    if (isHorizontal && Math.abs(distanceX) > minDistance) {
      const currentIndex = MAIN_TABS.indexOf(activeTab);
      if (currentIndex === -1) return; 

      const isLeftSwipe = distanceX > 0;
      const isRightSwipe = distanceX < 0;

      if (dir === 'rtl') {
         if (isRightSwipe && currentIndex < MAIN_TABS.length - 1) {
            setActiveTab(MAIN_TABS[currentIndex + 1]);
         } else if (isLeftSwipe && currentIndex > 0) {
            setActiveTab(MAIN_TABS[currentIndex - 1]);
         }
      } else {
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
         { targetId: 'murshid-fab', title: 'Al-Murshid', content: 'Tap here to chat with your AI spiritual companion for guidance and reflection.' },
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
       ],
       'quran': [
          { targetId: 'quran-list-search', title: t('tour_quran_search_title'), content: t('tour_quran_search_content') },
          { targetId: 'quran-list-tabs', title: t('tour_quran_tabs_title'), content: t('tour_quran_tabs_content') },
          { targetId: 'quran-surah-list-first', title: t('tour_quran_item_title'), content: t('tour_quran_item_content') },
       ]
     };
     return tours[activeTab] || [];
  }, [activeTab, t]);

  const nextPrayer = prayers.find(p => p.isNext) || prayers[0];

  const renderContent = () => {
    switch (activeTab) {
      case 'dua':
        return <DuaPage onBack={() => setActiveTab('home')} onHelp={() => setIsTourOpen(true)} />;
      case 'quran':
        return <QuranReader onHelp={() => setIsTourOpen(true)} />;
      case 'partners':
        return <RakibSystem />;
      case 'habits':
        return <HabitTracker onBack={() => setActiveTab('home')} />;
      case 'lectures':
        return <LecturesPage />;
      case 'profile':
        return <ProfilePage user={user} />;
      case 'stats':
        return <AnalyticsPage prayers={prayers} />;
      case 'home':
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <Hero />
            
            {loadingLocation ? (
               <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center text-neutral-400 space-y-3 border border-neutral-100">
                  <Loader2 className="animate-spin text-brand-forest" size={32} />
                  <p className="text-xs font-medium">Calibrating location & prayer times...</p>
               </div>
            ) : (
               <PrayerCard 
                 nextPrayerName={nextPrayer.name}
                 nextPrayerTime={nextPrayer.time}
                 currentTimeStr="--" 
               />
            )}

            <HeartStateWidget 
              currentState={user.currentHeartState}
              onSelect={handleHeartStateSelect}
              prayers={prayers}
            />
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
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="max-w-md mx-auto bg-neutral-body min-h-screen relative shadow-2xl shadow-black/5 overflow-hidden transition-colors duration-300">
        
        {/* Conditional Header: We hide the main header for specific immersive pages like Quran/Dua */}
        <div className="px-5 pt-safe-top space-y-1">
          {!['dua', 'quran'].includes(activeTab) && (
             <Header user={user} onHelpClick={() => setIsTourOpen(true)} />
          )}
          
          <main className={['dua', 'quran'].includes(activeTab) ? 'pt-0 -mx-5' : 'pt-2 pb-10'}>
            {renderContent()}
          </main>
        </div>

        {/* Floating Murshid Action Button */}
        {!['quran'].includes(activeTab) && (
          <button
            id="murshid-fab"
            onClick={() => setIsMurshidOpen(true)}
            className="fixed bottom-24 right-5 rtl:right-auto rtl:left-5 w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl flex items-center justify-center text-white z-40 animate-in zoom-in duration-300 hover:scale-110 active:scale-95 transition-all group border-4 border-neutral-body"
          >
            <MessageCircle size={28} className="fill-current" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </button>
        )}

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
        <QiblaFinder isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
        <MurshidChat isOpen={isMurshidOpen} onClose={() => setIsMurshidOpen(false)} user={user} prayers={prayers} />
        
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

      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;