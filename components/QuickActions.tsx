
import React from 'react';
import { BookOpen, Compass, Heart, List, RotateCcw, Settings, GraduationCap, CheckSquare, PlayCircle } from 'lucide-react';
import { QuickAction, ActionId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface QuickActionsProps {
  onActionClick: (id: ActionId) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const { t, language } = useLanguage();

  const ACTIONS: QuickAction[] = [
    { id: 'lectures', label: t('quran'), icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'qibla', label: t('qibla'), icon: Compass, color: 'text-blue-600 bg-blue-50' },
    { id: 'dua', label: t('dua'), icon: Heart, color: 'text-rose-600 bg-rose-50' },
    { id: 'tasbih', label: t('tasbih'), icon: List, color: 'text-purple-600 bg-purple-50' },
    { id: 'study', label: t('study_space'), icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
    { id: 'habits', label: t('habit_tracker'), icon: CheckSquare, color: 'text-green-600 bg-green-50' },
    { id: 'content', label: t('content_hub'), icon: PlayCircle, color: 'text-pink-600 bg-pink-50' },
    { id: 'qada', label: t('qada'), icon: RotateCcw, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div id="quick-actions" className="grid grid-cols-2 gap-4 mb-8 px-1">
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick(action.id)}
          className="group relative flex flex-row items-center p-3.5 rounded-2xl bg-brand-surface border border-brand-border/50 shadow-sm hover:shadow-premium hover:border-brand-primary/20 hover:bg-brand-surface transition-all duration-300 text-left"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${action.color} bg-opacity-10 group-hover:scale-105 transition-transform`}>
            <action.icon size={20} strokeWidth={2} className="opacity-90" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <span className="text-sm font-bold text-brand-forest block leading-tight group-hover:text-brand-primary transition-colors truncate">
              {action.label}
            </span>
          </div>
          <div className="absolute right-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            {/* Optional arrow or indicator on hover if desired */}
          </div>
        </button>
      ))}
    </div>
  );

};
