
import React, { useState, useEffect, useRef } from 'react';
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
import { MOCK_USER, INITIAL_PRAYERS, MOCK_QADA } from './constants';
import { Prayer, PrayerStatus, ActionId, HeartCondition } from './types';

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
    // In a real app, send this to backend to correlate with prayer stats
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

  // Find next prayer logic
  const nextPrayer = prayers.find(p => p.isNext) || prayers[0];

  // Render Content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dua':
        return <DuaPage onBack={() => setActiveTab('home')} />;
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
          {/* Hide header on full-page specific views to give them more space, or keep it for consistency. 
              Let's keep it consistent except for DuaPage which has its own internal header. */}
          {activeTab !== 'dua' && <Header user={user} />}
          
          <main className={activeTab === 'dua' ? 'pt-0 -mx-5' : 'pt-2 pb-10'}>
            {renderContent()}
          </main>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Modals */}
        <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
        <QiblaFinder isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
        
        <PrayerDetailModal 
          isOpen={!!selectedPrayer} 
          prayer={selectedPrayer} 
          onClose={() => setSelectedPrayer(null)}
          onSave={updatePrayer}
        />
      </div>
    </div>
  );
};

export default App;
