
import React from 'react';
import { Home, BookOpen, BarChart2, User, Users, Book } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const BottomNav: React.FC<{ activeTab: string; onTabChange: (id: string) => void; }> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'partners', label: t('nav_partners'), icon: Users },
    { id: 'quran', label: t('nav_quran'), icon: Book },
    { id: 'lectures', label: t('nav_lectures'), icon: BookOpen },
    { id: 'stats', label: t('nav_stats'), icon: BarChart2 },
    { id: 'profile', label: t('nav_profile'), icon: User },
  ];

  return (
    <div id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-line shadow-nav pb-safe-area z-40">
      <div className="flex justify-around items-center h-16 px-1">
        {NAV_ITEMS.map((item) => (
          <button 
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex flex-col items-center justify-center min-w-[3.5rem] py-1
              transition-colors duration-200 cursor-pointer
              ${activeTab === item.id ? 'text-brand-forest' : 'text-neutral-400 hover:text-neutral-600'}
            `}
          >
            <item.icon 
              size={24} 
              strokeWidth={activeTab === item.id ? 2.5 : 2} 
              className={activeTab === item.id ? 'mb-1' : 'mb-1'}
            />
            <span className={`text-[9px] font-medium ${activeTab === item.id ? 'opacity-100' : 'opacity-0'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
      {/* Safe Area Spacer for iOS home indicator */}
      <div className="h-5 w-full bg-white"></div>
    </div>
  );
};
