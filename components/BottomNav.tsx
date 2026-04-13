
import React from 'react';
import { Home, BookOpen, BarChart2, User, Users, Book } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const BottomNav: React.FC<{ activeTab: string; onTabChange: (id: string) => void; }> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'partners', label: t('nav_partners'), icon: Users },
    { id: 'quran', label: t('nav_quran'), icon: Book },
    // Lectures tab removed as per user request
    { id: 'stats', label: t('nav_stats'), icon: BarChart2 },
    { id: 'profile', label: t('nav_profile'), icon: User },
  ];

  return (

    <div id="bottom-nav" className="w-full bg-brand-surface/90 backdrop-blur-xl border-t border-brand-border/50 flex justify-center py-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="w-full max-w-lg px-2 flex items-center justify-between">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                relative flex-1 flex flex-col items-center justify-center py-2
                transition-all duration-300 group
                ${isActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-forest'}
              `}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-brand-primary/10 -translate-y-1' : 'group-hover:bg-brand-subtle'}`}>
                <item.icon
                  size={isActive ? 24 : 22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-300 ${isActive ? 'drop-shadow-sm' : ''}`}
                />
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 h-0 overflow-hidden'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-1 rounded-t-full bg-brand-primary shadow-[0_0_8px_rgba(var(--brand-primary),0.6)]"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
