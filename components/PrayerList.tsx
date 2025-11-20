
import React from 'react';
import { Prayer, PrayerStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import { Check, ChevronRight, Home, Users, Clock, AlertCircle, Star, Edit3 } from 'lucide-react';

interface PrayerListProps {
  prayers: Prayer[];
  onPrayerClick: (prayer: Prayer) => void;
}

export const PrayerList: React.FC<PrayerListProps> = ({ prayers, onPrayerClick }) => {
  
  const getStatusIcon = (status: PrayerStatus) => {
    switch (status) {
      case PrayerStatus.Jamaah: return <Users size={12} />;
      case PrayerStatus.Home: return <Home size={12} />;
      case PrayerStatus.Late: return <Clock size={12} />;
      case PrayerStatus.Missed: return <AlertCircle size={12} />;
      case PrayerStatus.QadaDone: return <Check size={12} />;
      default: return <ChevronRight size={14} />;
    }
  };

  return (
    <div id="prayer-list" className="space-y-3 mb-8">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="font-bold text-lg text-neutral-primary">Today's Prayers</h3>
        <button className="text-xs font-medium text-brand-forest hover:underline">See Weekly Stats</button>
      </div>

      {prayers.map((prayer) => (
        <div 
          key={prayer.id}
          onClick={() => onPrayerClick(prayer)}
          className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-brand-mint cursor-pointer transition-all duration-300 active:scale-[0.99]"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-1.5 h-10 rounded-full transition-colors duration-300 ${prayer.status === PrayerStatus.Missed ? 'bg-status-missed' : (prayer.status === PrayerStatus.Upcoming ? 'bg-neutral-200' : 'bg-brand-forest')}`}></div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-neutral-primary">{prayer.name}</span>
                  <span className="text-xs text-neutral-muted font-arabic">{prayer.arabicName}</span>
                </div>
                <span className="text-xs text-neutral-500 font-mono">{prayer.time}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Metadata Icons */}
              {prayer.khushuRating && prayer.khushuRating > 0 && (
                <div className="flex items-center space-x-0.5 text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded-md">
                  <Star size={10} className="fill-current" />
                  <span className="text-[10px] font-bold">{prayer.khushuRating}</span>
                </div>
              )}
              {prayer.journalEntry && (
                <div className="text-brand-teal">
                  <Edit3 size={12} />
                </div>
              )}

              <div className={`
                  flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 shadow-sm
                  ${STATUS_COLORS[prayer.status]}
                `}
              >
                {getStatusIcon(prayer.status)}
                <span>{STATUS_LABELS[prayer.status]}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
