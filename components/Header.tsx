
import React from 'react';
import { MapPin, HelpCircle, Sparkles } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  user: User;
  onHelpClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onHelpClick }) => {
  const { t } = useLanguage();

  return (
    <header className="flex justify-between items-start pt-2 pb-4" id="app-header">
      <div id="header-user-info">
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-brand-forest font-medium mb-0.5">
          <MapPin size={16} className="fill-current opacity-20" />
          <span className="text-sm tracking-tight">{user.location}</span>
        </div>
        <p className="text-xs text-neutral-muted font-medium">{user.hijriDate}</p>
      </div>
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {onHelpClick && (
          <button 
            onClick={onHelpClick}
            className="flex items-center space-x-1.5 rtl:space-x-reverse bg-gradient-to-r from-brand-forest to-brand-teal text-white px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transform transition-all active:scale-95"
          >
            <Sparkles size={14} className="fill-current" />
            <span className="text-xs font-bold">{t('guide')}</span>
          </button>
        )}
        <div className="relative">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
          />
          <div className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
      </div>
    </header>
  );
};
