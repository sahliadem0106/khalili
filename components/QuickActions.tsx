
import React from 'react';
import { BookOpen, Compass, Heart, List, RotateCcw, Settings, Share2, Sprout } from 'lucide-react';
import { QuickAction, ActionId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface QuickActionsProps {
  onActionClick: (id: ActionId) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const { t } = useLanguage();

  const ACTIONS: QuickAction[] = [
    { id: 'lectures', label: t('quran'), icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { id: 'qibla', label: t('qibla'), icon: Compass, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'dua', label: t('dua'), icon: Heart, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400' },
    { id: 'tasbih', label: t('tasbih'), icon: List, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 'habits', label: 'Habits', icon: Sprout, color: 'text-lime-600 bg-lime-50 dark:bg-lime-900/30 dark:text-lime-400' },
    { id: 'zakat', label: t('zakat'), icon: Share2, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: 'qada', label: t('qada'), icon: RotateCcw, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { id: 'settings', label: t('settings'), icon: Settings, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400' },
  ];

  return (
    <div id="quick-actions" className="grid grid-cols-4 gap-y-6 gap-x-4 mb-8">
      {ACTIONS.map((action) => (
        <button 
          key={action.id} 
          onClick={() => onActionClick(action.id)}
          className="flex flex-col items-center space-y-2 group cursor-pointer bg-transparent border-none p-0 focus:outline-none"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 group-active:scale-90 group-hover:shadow-md ${action.color}`}>
            <action.icon size={24} strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{action.label}</span>
        </button>
      ))}
    </div>
  );
};
