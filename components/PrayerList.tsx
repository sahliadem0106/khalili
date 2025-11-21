
import React from 'react';
import { Prayer, PrayerStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Check, ChevronRight, ChevronLeft, Home, Users, Clock, AlertCircle, Star, Edit3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrayerListProps {
  prayers: Prayer[];
  onPrayerClick: (prayer: Prayer) => void;
}

export const PrayerList: React.FC<PrayerListProps> = ({ prayers, onPrayerClick }) => {
  const { t, language, dir } = useLanguage();
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  // Map status to translated strings dynamically
  const getStatusLabel = (status: PrayerStatus) => {
    switch (status) {
      case PrayerStatus.Jamaah: return t('status_jamaah');
      case PrayerStatus.Home: return t('status_home');
      case PrayerStatus.Late: return t('status_late');
      case PrayerStatus.Missed: return t('status_missed');
      case PrayerStatus.QadaDone: return t('status_qada_done');
      default: return t('status_upcoming');
    }
  };
  
  const getStatusIcon = (status: PrayerStatus) => {
    switch (status) {
      case PrayerStatus.Jamaah: return <Users size={12} />;
      case PrayerStatus.Home: return <Home size={12} />;
      case PrayerStatus.Late: return <Clock size={12} />;
      case PrayerStatus.Missed: return <AlertCircle size={12} />;
      case PrayerStatus.QadaDone: return <Check size={12} />;
      default: return <ChevronIcon size={14} />;
    }
  };

  return (
    <div id="prayer-list" className="space-y-3 mb-8">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="font-bold text-lg text-neutral-primary">{t('todaysPrayers')}</h3>
        <button className="text-xs font-medium text-brand-forest hover:underline">{t('weeklyStats')}</button>
      </div>

      {prayers.map((prayer) => (
        <div 
          key={prayer.id}
          onClick={() => onPrayerClick(prayer)}
          className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-brand-mint cursor-pointer transition-all duration-300 active:scale-[0.99]"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className={`w-1.5 h-10 rounded-full transition-colors duration-300 ${prayer.status === PrayerStatus.Missed ? 'bg-status-missed' : (prayer.status === PrayerStatus.Upcoming ? 'bg-neutral-200' : 'bg-brand-forest')}`}></div>
              <div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="font-semibold text-neutral-primary">{language === 'ar' ? prayer.arabicName : prayer.name}</span>
                  <span className="text-xs text-neutral-muted font-arabic">{language === 'ar' ? prayer.name : prayer.arabicName}</span>
                </div>
                <span className="text-xs text-neutral-500 font-mono">{prayer.time}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {/* Metadata Icons */}
              {prayer.khushuRating && prayer.khushuRating > 0 && (
                <div className="flex items-center space-x-0.5 rtl:space-x-reverse text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded-md">
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
                  flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 shadow-sm
                  ${STATUS_COLORS[prayer.status]}
                `}
              >
                {getStatusIcon(prayer.status)}
                <span>{getStatusLabel(prayer.status)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
