
import React, { useState, useEffect } from 'react';
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
import { MurshidChat } from './components/MurshidChat';
import { ZakatCalculator } from './components/ZakatCalculator';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext'; 
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { INITIAL_PRAYERS, MOCK_QADA, MOCK_USER } from './constants';
import { Prayer, ActionId } from './types';
import { MessageCircle, ChevronLeft } from 'lucide-react';
import { fetchPrayerTimes } from './services/prayerService';

const AppContent: React.FC = () => {
  // Get Auth State
  const { user: authUser } = useAuth();
  const { t, dir } = useLanguage();

  // Data State
  const [prayers, setPrayers] = useState<Prayer[]>(() => {
    const saved = localStorage.getItem('muslimDaily_prayers');
    return saved ? JSON.parse(saved) : INITIAL_PRAYERS;
  });
  
  const [localUser, setLocalUser] = useState(authUser || MOCK_USER);
  const [qadaStats, setQadaStats] = useState(MOCK_QADA); // In real app, fetch from DB

  // UI State
  const [activeTab, setActiveTab] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Modals & Overlays
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isMurshidOpen, setIsMurshidOpen] = useState(false); 
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [isPrayerDetailOpen, setIsPrayerDetailOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Feature Views (Full Screen Overlays)
  const [activeFeature, setActiveFeature] = useState<ActionId | null>(null);

  // Tour Config
  const tourSteps: TourStep[] = [
    { targetId: 'app-header', title: t('tour_home_profile_title'), content: t('tour_home_profile_content') },
    { targetId: 'hero-section', title: t('tour_home_hero_title'), content: t('tour_home_hero_content') },
    { targetId: 'next-prayer-card', title: t('tour_home_next_title'), content: t('tour_home_next_content') },
    { targetId: 'quick-actions', title: t('tour_home_quick_title'), content: t('tour_home_quick_content') },
    { targetId: 'prayer-list', title: t('tour_home_list_title'), content: t('tour_home_list_content') },
    { targetId: 'bottom-nav', title: t('tour_home_nav_title'), content: t('tour_home_nav_content') },
  ];

  // Sync Auth User with Local User
  useEffect(() => {
    if (authUser) {
      setLocalUser(prev => ({
        ...prev,
        ...authUser,
        // Keep local heart state if not in authUser
        currentHeartState: authUser.currentHeartState || prev.currentHeartState
      }));
    }
  }, [authUser]);

  // Initialize Real Data (Prayer Times)
  useEffect(() => {
    const initData = async () => {
      const lastFetchDate = localStorage.getItem('muslimDaily_lastFetchDate');
      const todayStr = new Date().toDateString();

      // Simple check to avoid refetching if already done today (can be improved)
      if (lastFetchDate !== todayStr || prayers === INITIAL_PRAYERS) {
        setLoadingLocation(true);
        let lat = 21.4225; // Mecca default
        let long = 39.8262;

        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            lat = position.coords.latitude;
            long = position.coords.longitude;
          } catch (e) {
            console.log("Geolocation failed/denied, using default.");
          }
        }

        const data = await fetchPrayerTimes(lat, long);
        if (data) {
          setPrayers(data.prayers);
          setLocalUser(prev => ({ 
             ...prev, 
             location: data.locationName === 'Local Coordinates' ? 'My Location' : data.locationName,
             hijriDate: data.hijriDate 
          }));
          localStorage.setItem('muslimDaily_prayers', JSON.stringify(data.prayers));
          localStorage.setItem('muslimDaily_lastFetchDate', todayStr);
        }
        setLoadingLocation(false);
      }
    };

    initData();
  }, []);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setActiveFeature(null);
  };

  const handleActionClick = (id: ActionId) => {
    if (id === 'tasbih') setIsTasbihOpen(true);
    else if (id === 'qibla') setIsQiblaOpen(true);
    else if (id === 'settings') handleTabChange('profile');
    else if (id === 'lectures') handleTabChange('lectures');
    else if (id === 'partners') handleTabChange('partners');
    else if (id === 'quran') handleTabChange('quran');
    else setActiveFeature(id); // dua, zakat, habits, qada, goals
  };

  // Render content based on active feature or tab
  const renderMainContent = () => {
    // 1. Feature Overlays
    if (activeFeature === 'dua') return <DuaPage onBack={() => setActiveFeature(null)} onHelp={() => setIsTourOpen(true)} />;
    if (activeFeature === 'habits') return <HabitTracker onBack={() => setActiveFeature(null)} />;
    if (activeFeature === 'zakat') {
       return (
          <div className="pb-20 px-4 pt-6">
             <div className="flex items-center mb-4">
               <button onClick={() => setActiveFeature(null)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                 <ChevronLeft className="rtl:rotate-180 text-neutral-600 dark:text-neutral-300" size={24} />
               </button>
               <span className="font-bold text-lg ms-2">{t('back')}</span>
             </div>
             <ZakatCalculator />
          </div>
       );
    }
    if (activeFeature === 'qada') {
        return (
           <div className="pb-20 px-4 pt-6">
              <div className="flex items-center mb-6">
                <button onClick={() => setActiveFeature(null)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <ChevronLeft className="rtl:rotate-180 text-neutral-600 dark:text-neutral-300" size={24} />
                </button>
                <h2 className="text-2xl font-bold text-neutral-primary ms-2">{t('action_qada')}</h2>
              </div>
              <QadaTracker stats={qadaStats} />
           </div>
        );
    }

    // 2. Main Tabs
    switch (activeTab) {
      case 'home':
        return (
          <div className="px-4 animate-in fade-in">
            <Header user={localUser} onHelpClick={() => setIsTourOpen(true)} />
            <Hero />
            <PrayerCard 
               nextPrayerName={prayers.find(p => p.isNext)?.name || "Fajr"} 
               nextPrayerTime={prayers.find(p => p.isNext)?.time || "05:00"} 
               currentTimeStr="" 
            />
            <QuickActions onActionClick={handleActionClick} />
            <HeartStateWidget 
               currentState={localUser.currentHeartState} 
               onSelect={(state) => setLocalUser({...localUser, currentHeartState: state})}
               prayers={prayers}
            />
            <PrayerList 
               prayers={prayers} 
               onPrayerClick={(p) => { setSelectedPrayer(p); setIsPrayerDetailOpen(true); }} 
            />
          </div>
        );
      case 'partners': return <div className="px-4 pt-4"><RakibSystem /></div>;
      case 'quran': return <QuranReader onHelp={() => setIsTourOpen(true)} />;
      case 'lectures': return <div className="px-4 pt-4"><LecturesPage /></div>;
      case 'stats': return <div className="px-4 pt-4"><AnalyticsPage prayers={prayers} /></div>;
      case 'profile': return <div className="px-4 pt-4"><ProfilePage user={localUser} /></div>;
      default: return null;
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className={`min-h-screen bg-neutral-body text-neutral-primary font-sans ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      
      {/* Global Overlays */}
      <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
      <QiblaFinder isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
      <MurshidChat isOpen={isMurshidOpen} onClose={() => setIsMurshidOpen(false)} user={localUser} prayers={prayers} />
      <GuidedTour isOpen={isTourOpen} steps={tourSteps} onClose={() => setIsTourOpen(false)} />
      
      <PrayerDetailModal 
         prayer={selectedPrayer}
         isOpen={isPrayerDetailOpen}
         onClose={() => setIsPrayerDetailOpen(false)}
         onSave={(id, updates) => {
            setPrayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            // Also update persistent store if needed
         }}
      />

      {/* Main Scrollable Content */}
      <div className={`pb-24 ${activeFeature ? '' : ''}`}>
        {renderMainContent()}
      </div>

      {/* Navigation Bar (Hidden in full-screen features) */}
      {!activeFeature && (
         <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Floating Chat Button (Hidden in features/chat) */}
      {!activeFeature && !isMurshidOpen && activeTab === 'home' && (
        <button 
          onClick={() => setIsMurshidOpen(true)}
          className="fixed bottom-24 right-4 rtl:right-auto rtl:left-4 w-14 h-14 bg-brand-forest text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-30"
        >
          <MessageCircle size={28} />
        </button>
      )}

    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
