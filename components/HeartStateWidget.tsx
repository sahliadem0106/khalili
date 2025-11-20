import React, { useMemo } from 'react';
import { Card } from './ui/Card';
import { HeartCondition, Prayer, PrayerStatus } from '../types';
import { Heart, CloudRain, Sun, Zap, Coffee, Activity, TrendingUp } from 'lucide-react';

interface HeartStateWidgetProps {
  currentState?: HeartCondition;
  onSelect: (state: HeartCondition) => void;
  prayers: Prayer[];
}

const STATES: { id: HeartCondition; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'peaceful', label: 'Peaceful', icon: Sun, color: 'text-orange-400 bg-orange-50' },
  { id: 'grateful', label: 'Grateful', icon: Heart, color: 'text-rose-500 bg-rose-50' },
  { id: 'anxious', label: 'Anxious', icon: Zap, color: 'text-yellow-600 bg-yellow-50' },
  { id: 'distracted', label: 'Distracted', icon: Coffee, color: 'text-slate-500 bg-slate-50' },
  { id: 'sad', label: 'Low', icon: CloudRain, color: 'text-blue-400 bg-blue-50' },
];

export const HeartStateWidget: React.FC<HeartStateWidgetProps> = ({ currentState, onSelect, prayers }) => {
  
  // Calculate Spiritual Heart Health Score (0-100%)
  // Logic: Jamaah=100, Home=90, Late=50, Missed=0, Upcoming doesn't count yet
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
            <Activity size={16} className="mr-2 text-brand-forest" />
            Spiritual Heart State
          </h3>
          <p className="text-xs text-neutral-muted mt-1">
            Based on prayer timeliness & presence
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
      <div className="absolute top-2 right-16 opacity-5">
         <Heart size={120} className="fill-current" />
      </div>

      {/* Weekly Trend Mini-Indicator */}
      <div className="flex items-center space-x-2 mb-6 bg-neutral-50 p-2 rounded-lg border border-neutral-100/50">
         <TrendingUp size={14} className="text-brand-forest" />
         <span className="text-xs text-neutral-600">
           Your heart state is <strong>improving</strong> (+5% vs last week)
         </span>
      </div>
      
      {/* Emotional Check-in Selector */}
      <div>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
          How do you feel right now?
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
                  ${isSelected ? 'bg-brand-forest shadow-md scale-105' : 'bg-white border border-neutral-line hover:bg-neutral-50'}
                `}
              >
                <div className={`mb-1 ${isSelected ? 'text-white' : state.color.split(' ')[0]}`}>
                  <state.icon size={20} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-neutral-500'}`}>
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