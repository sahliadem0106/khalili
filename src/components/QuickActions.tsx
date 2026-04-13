
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
    { id: 'study', label: language === 'ar' ? 'الدراسة' : 'Study', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
    { id: 'habits', label: language === 'ar' ? 'العادات' : 'Habits', icon: CheckSquare, color: 'text-green-600 bg-green-50' },
    { id: 'content', label: language === 'ar' ? 'المحتوى' : 'Content', icon: PlayCircle, color: 'text-pink-600 bg-pink-50' },
    { id: 'qada', label: t('qada'), icon: RotateCcw, color: 'text-indigo-600 bg-indigo-50' },
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
          <span className="text-xs font-medium text-neutral-600">{action.label}</span>
        </button>
      ))}
    </div>
  );
};
