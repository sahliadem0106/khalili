
import React, { useMemo } from 'react';
import { Card } from './ui/Card';
import { HeartCondition, Prayer, PrayerStatus } from '../types';
import { Heart, CloudRain, Sun, Zap, Coffee, Activity, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeartStateWidgetProps {
  currentState?: HeartCondition;
  onSelect: (state: HeartCondition) => void;
  prayers: Prayer[];
}

export const HeartStateWidget: React.FC<HeartStateWidgetProps> = ({ currentState, onSelect, prayers }) => {
  const { t } = useLanguage();

  const STATES: { id: HeartCondition; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'peaceful', label: t('feel_peaceful'), icon: Sun, color: 'text-orange-400 bg-orange-50 dark:bg-orange-900/20' },
    { id: 'grateful', label: t('feel_grateful'), icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
    { id: 'anxious', label: t('feel_anxious'), icon: Zap, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'distracted', label: t('feel_distracted'), icon: Coffee, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
    { id: 'sad', label: t('feel_sad'), icon: CloudRain, color: 'text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
  ];
  
  // Calculate Spiritual Heart Health Score (0-100%)
  const heartScore = useMemo(() => {
    const completedPrayers = prayers.filter(p => p.status !== PrayerStatus.Upcoming);
    if (completedPrayers.length === 0) return 100; // Start fresh day with full heart

    const totalPoints = completedPrayers.reduce((acc, p) => {
      switch (p.status) {
        case PrayerStatus.Jamaah: return acc + 100;
        case PrayerStatus.Home: return acc + 90;
        case PrayerStatus.Late: return acc + 50;
        case PrayerStatus.QadaDone: return acc + 60;
        case PrayerStatus.Missed: return acc + 0;
        default: return acc;
      }
    }, 0);

    return Math.round(totalPoints / completedPrayers.length);
  }, [prayers]);

  const getHeartColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHeartLabel = (score: number) => {
    // Translations for these simple words can be reused or added if needed
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Weak';
    return 'Critical';
  };

  return (
    <Card className="mb-6 overflow-hidden relative">
      {/* Header with Score */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-neutral-primary text-sm flex items-center">
            <Activity size={16} className="me-2 text-brand-forest" />
            {t('heartState')}
          </h3>
          <p className="text-xs text-neutral-muted mt-1">
            {t('heartSubtitle')}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getHeartColor(heartScore)}`}>{heartScore}%</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            {getHeartLabel(heartScore)}
          </div>
        </div>
      </div>

      {/* Visual Heart Representation */}
      <div className="absolute top-2 right-16 rtl:right-auto rtl:left-16 opacity-5">
         <Heart size={120} className="fill-current" />
      </div>

      {/* Weekly Trend Mini-Indicator */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6 bg-neutral-50 dark:bg-neutral-800 p-2 rounded-lg border border-neutral-100/50 dark:border-neutral-700">
         <TrendingUp size={14} className="text-brand-forest rtl:flip-x" />
         <span className="text-xs text-neutral-600 dark:text-neutral-400">
           Your heart state is <strong>improving</strong> (+5% vs last week)
         </span>
      </div>
      
      {/* Emotional Check-in Selector */}
      <div>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
          {t('howYouFeel')}
        </p>
        <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {STATES.map((state) => {
            const isSelected = currentState === state.id;
            return (
              <button
                key={state.id}
                onClick={() => onSelect(state.id)}
                className={`
                  flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl transition-all duration-300
                  ${isSelected ? 'bg-brand-forest shadow-md scale-105' : 'bg-neutral-card border border-neutral-line hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                `}
              >
                <div className={`mb-1 ${isSelected ? 'text-white' : state.color.split(' ')[0]}`}>
                  <state.icon size={20} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  {state.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
