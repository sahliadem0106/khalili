
import React, { useMemo, useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { HeartCondition, Prayer, PrayerStatus } from '../types';
import { Heart, CloudRain, Sun, Zap, Coffee, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { metricsService, UserMetrics } from '../services/MetricsService';

interface HeartStateWidgetProps {
  currentState?: HeartCondition;
  onSelect: (state: HeartCondition) => void;
  prayers: Prayer[];
}

export const HeartStateWidget: React.FC<HeartStateWidgetProps> = ({ currentState, onSelect, prayers }) => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);

  // Load metrics from MetricsService
  useEffect(() => {
    setMetrics(metricsService.getMetrics());

    const unsubscribe = metricsService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => unsubscribe();
  }, []);

  const STATES = [
    { id: 'peaceful', label: t('feel_peaceful'), icon: Sun, color: 'text-orange-400 bg-orange-500/10' },
    { id: 'grateful', label: t('feel_grateful'), icon: Heart, color: 'text-rose-500 bg-rose-500/10' },
    { id: 'anxious', label: t('feel_anxious'), icon: Zap, color: 'text-yellow-500 bg-yellow-500/10' },
    { id: 'distracted', label: t('feel_distracted'), icon: Coffee, color: 'text-slate-400 bg-slate-500/10' },
    { id: 'sad', label: t('feel_sad'), icon: CloudRain, color: 'text-blue-400 bg-blue-500/10' },
  ];

  // Use computed heart state from MetricsService
  const heartScore = metrics?.heartState ?? 50;

  const getHeartColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHeartLabel = (score: number) => {
    return metricsService.getHeartStateLabel(score);
  };

  // Trend indicator based on streak
  const getTrendInfo = () => {
    const streak = metrics?.prayerStreak ?? 0;
    if (streak >= 7) return { icon: TrendingUp, text: 'Consistent! Keep it up', color: 'text-brand-forest' };
    if (streak >= 3) return { icon: TrendingUp, text: 'Building momentum', color: 'text-emerald-400' };
    if (streak >= 1) return { icon: Minus, text: 'Getting started', color: 'text-neutral-500' };
    return { icon: TrendingDown, text: 'Start logging prayers', color: 'text-orange-500' };
  };

  const trend = getTrendInfo();

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
      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6 bg-brand-subtle p-2 rounded-lg border border-brand-border">
        <trend.icon size={14} className={`${trend.color} rtl:flip-x`} />
        <span className="text-xs text-brand-muted">
          {trend.text}
          {metrics && metrics.prayerStreak > 0 && (
            <strong className="ms-1">({metrics.prayerStreak} day streak)</strong>
          )}
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
                onClick={() => onSelect(state.id as HeartCondition)}
                className={`
                  flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl transition-all duration-300
                  ${isSelected ? 'bg-brand-primary shadow-md scale-105' : 'bg-brand-surface border border-brand-border hover:bg-brand-subtle'}
                `}
              >
                <div className={`mb-1 ${isSelected ? 'text-white' : state.color.split(' ')[0]}`}>
                  <state.icon size={20} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-brand-muted'}`}>
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
