
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
import { MOCK_USER, INITIAL_PRAYERS, MOCK_QADA } from './constants';
import { Prayer, PrayerStatus, ActionId, HeartCondition } from './types';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
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
         { targetId: 'app-header', title: 'Your Profile', content: 'Access your location settings and personal details here.' },
         { targetId: 'hero-section', title: 'Daily Inspiration', content: 'Find motivational quotes and seasonal updates to start your day.' },
         { targetId: 'next-prayer-card', title: 'Next Prayer', content: 'See exactly how much time is left until your next Salah.' },
         { targetId: 'quick-actions', title: 'Quick Tools', content: 'Instantly access Qibla, Tasbih, Dua, and more.' },
         { targetId: 'prayer-list', title: 'Prayer Tracker', content: 'Log your prayers daily. Tap any prayer to add details about your focus (Khushu).' },
         { targetId: 'bottom-nav', title: 'Navigation', content: 'Switch between Partners, Knowledge, Statistics, and Profile.' },
       ],
       'dua': [
         { targetId: 'dua-search', title: 'Smart Search', content: 'Find any Dua by topic, emotion, or keywords instantly.' },
         { targetId: 'dua-category-first', title: 'Categories', content: 'Tap any card to explore our curated collection of Duas for every occasion.' },
       ],
       'partners': [
          { targetId: 'partner-add-btn', title: 'Add Partner', content: 'Connect with friends or family to keep each other accountable.' },
          { targetId: 'partner-groups', title: 'Groups', content: 'Create circles for your family to track progress together.' },
       ],
       'stats': [
          { targetId: 'analytics-streak', title: 'Your Streak', content: 'Keep your momentum going! See how many days in a row you have prayed.' },
          { targetId: 'analytics-weakness', title: 'Insights', content: 'We analyze your logs to help you identify barriers like sleep or work.' },
       ],
       'lectures': [
          { targetId: 'lectures-featured', title: 'Featured Series', content: 'Hand-picked series to boost your knowledge this week.' },
          { targetId: 'lecture-card-first', title: 'Library', content: 'Browse lectures by category including Quran, Fiqh, and History. Tap to watch.' },
       ],
       'profile': [
          { targetId: 'profile-user-card', title: 'Your Identity', content: 'Manage your personal details and avatar here.' },
          { targetId: 'profile-settings-first', title: 'Settings', content: 'Customize calculation methods, adhan sounds, and app theme here.' },
       ]
     };
     return tours[activeTab] || [];
  }, [activeTab]);

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
    <div className="min-h-screen bg-neutral-body text-neutral-primary font-sans pb-20">
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
           className="fixed bottom-24 right-5 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-brand-forest to-brand-teal text-white shadow-lg shadow-brand-forest/40 flex items-center justify-center animate-pulse active:scale-90 transition-transform"
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

export default App;
