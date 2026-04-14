import React from 'react';
import { Home, BarChart2, User, Users, Book } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const BottomNav: React.FC<{ activeTab: string; onTabChange: (id: string) => void; isVisible?: boolean }> = ({ activeTab, onTabChange, isVisible = true }) => {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'partners', label: t('nav_partners'), icon: Users },
    { id: 'quran', label: t('nav_quran'), icon: Book },
    { id: 'stats', label: t('nav_stats'), icon: BarChart2 },
    { id: 'profile', label: t('nav_profile'), icon: User },
  ];

  return (
    <div id="bottom-nav" className={`w-full flex justify-center pb-6 pt-2 z-[100] px-4 absolute bottom-0 left-0 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}>
      <div className="w-full max-w-[400px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-full border border-black/5 dark:border-white/10 flex items-center justify-between px-7 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] shadow-brand-forest/10 pointer-events-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                relative flex flex-col items-center justify-center p-3
                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group rounded-full
                ${isActive 
                  ? 'text-white bg-brand-primary shadow-lg shadow-brand-primary/40 scale-110' 
                  : 'text-neutral-400 hover:text-brand-forest dark:hover:text-white'}
              `}
              aria-label={item.label}
              title={item.label}
            >
              <item.icon
                size={26}
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-all duration-300"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
