
import React from 'react';
import { BookOpen, Compass, Heart, List, RotateCcw, Settings, GraduationCap, CheckSquare, PlayCircle, Coins } from 'lucide-react';
import { QuickAction, ActionId } from '../types';
import { motion } from 'framer-motion';
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
    { id: 'zakat', label: t('zakat'), icon: Coins, color: 'text-amber-600 bg-amber-50' },
    { id: 'qada', label: t('qada'), icon: RotateCcw, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div id="quick-actions" className="grid grid-cols-4 gap-2.5 sm:gap-4 mb-6 px-1">
      {ACTIONS.map((action) => {
        const textColor = action.color.split(' ')[0]; // e.g. text-emerald-600
        const bgColor = action.color.split(' ')[1]; // e.g. bg-emerald-50
        
        return (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onActionClick(action.id)}
            className={`group flex flex-col items-center justify-center p-3 sm:p-4 rounded-3xl border border-white/50 shadow-sm hover:shadow-soft-xl transition-all duration-300 ${bgColor}`}
          >
            <div className={`${textColor} mb-1.5 group-hover:scale-110 transition-transform drop-shadow-sm`}>
              <action.icon size={26} strokeWidth={2.5} />
            </div>
            <span className={`text-[10px] sm:text-xs font-extrabold text-center w-full leading-tight whitespace-normal break-words ${textColor} opacity-90 group-hover:opacity-100 transition-opacity`}>
              {action.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );

};
