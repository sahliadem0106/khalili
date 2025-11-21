
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
import { GuidedTour, TourStep } from './components/GuidedTour';
import { SplashScreen } from './components/SplashScreen';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MOCK_USER, INITIAL_PRAYERS, MOCK_QADA } from './constants';
import { Prayer, PrayerStatus, ActionId, HeartCondition } from './types';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
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
  const [showSplash, setShowSplash] = useState(true);

  const { t } = useLanguage();

  // References for scrolling
  const qadaRef = useRef<HTMLDivElement>(null);

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
        setActiveTab('lectures');
        break;
      default:
        console.log(`Action ${id} clicked`);
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

  const nextPrayer = prayers.find(p => p.isNext) || prayers[0];

  const renderContent = () => {
    switch (activeTab) {
      case 'dua':
        return <DuaPage onBack={() => setActiveTab('home')} onHelp={() => setIsTourOpen(true)} />;
      case 'partners':
        return <RakibSystem />;
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
            <PrayerCard 
              nextPrayerName={nextPrayer.name}
              nextPrayerTime={nextPrayer.time}
              currentTimeStr="14:42" 
            />
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
    <div className="min-h-screen bg-neutral-body text-neutral-primary font-sans pb-20" dir="auto">
      {/* Splash Screen Layer */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="max-w-md mx-auto bg-neutral-body min-h-screen relative shadow-2xl shadow-black/5 overflow-hidden">
        
        <div className="px-5 pt-safe-top space-y-1">
          {activeTab !== 'dua' && (
             <Header user={user} />
          )}
          
          <main className={activeTab === 'dua' ? 'pt-0 -mx-5' : 'pt-2 pb-10'}>
            {renderContent()}
          </main>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Global Floating Help Button */}
        <button 
           onClick={() => setIsTourOpen(true)}
           className="fixed bottom-24 right-5 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-brand-forest to-brand-teal text-white shadow-lg shadow-brand-forest/40 flex items-center justify-center animate-pulse active:scale-90 transition-transform rtl:right-auto rtl:left-5"
           aria-label="Start Tour"
        >
           <Sparkles size={22} className="fill-white/20" />
        </button>
        
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

      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
