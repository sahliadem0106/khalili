/**
 * PrayerList - Today's prayers with real calculated times
 * Now integrates with usePrayerTimes hook for actual prayer data
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Prayer, PrayerStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Check, ChevronRight, ChevronLeft, Home, Users, Clock, AlertCircle, Star, Edit3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { prayerTimesService } from '../services/PrayerTimesService';

interface PrayerListProps {
  prayers: Prayer[];
  onPrayerClick: (prayer: Prayer) => void;
}

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Extended prayer type with computed fields from real prayer times
interface EnhancedPrayer extends Prayer {
  realTime?: Date;
  isNext?: boolean;
  isShuruk?: boolean;
}

// Prayer background images
const PRAYER_IMAGES: Record<string, string> = {
  fajr: '/images/prayers/Fajr.jpg',
  sunrise: '/images/prayers/Shuruk.jpg',
  dhuhr: '/images/prayers/Dhuhr.jpg',
  asr: '/images/prayers/Asr.jpg',
  maghrib: '/images/prayers/Marghib.jpg',
  isha: '/images/prayers/Isha.jpg',
};

export const PrayerList: React.FC<PrayerListProps> = ({ prayers, onPrayerClick }) => {
  const { t, language, dir } = useLanguage();
  const { prayerTimes, nextPrayer } = usePrayerTimes();
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const [isTravelMode, setIsTravelMode] = useState(false);
  const TRAVEL_MODE_KEY = 'khalil_travel_mode';

  useEffect(() => {
    try {
      setIsTravelMode(localStorage.getItem(TRAVEL_MODE_KEY) === 'true');
    } catch {
      setIsTravelMode(false);
    }
  }, []);

  // Merge real times with prayer status data and add Shuruk after Fajr
  const prayersWithRealTimes = useMemo(() => {
    if (!prayerTimes) return prayers;

    const result: EnhancedPrayer[] = [];

    prayers.forEach(prayer => {
      const prayerId = prayer.id.toLowerCase();
      const realTime = prayerTimes[prayerId as keyof typeof prayerTimes];

      if (realTime instanceof Date) {
        result.push({
          ...prayer,
          time: prayerTimesService.formatTime(realTime, false),
          realTime: realTime,
          isNext: nextPrayer?.name.toLowerCase() === prayerId,
        });
      } else {
        result.push(prayer);
      }

      // Insert Shuruk (Sunrise) after Fajr
      if (prayerId === 'fajr' && prayerTimes.sunrise) {
        result.push({
          id: 'sunrise',
          name: 'Shuruk',
          arabicName: 'الشروق',
          time: prayerTimesService.formatTime(prayerTimes.sunrise, false),
          realTime: prayerTimes.sunrise,
          status: PrayerStatus.Display, // Special status for non-loggable
          isShuruk: true, // Flag to identify this is Shuruk
          isNext: nextPrayer?.name.toLowerCase() === 'sunrise',
        });
      }
    });

    return result;
  }, [prayers, prayerTimes, nextPrayer]);

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

  // Determine if a prayer time has passed
  const hasPassed = (prayer: any) => {
    if (!prayer.realTime) return false;
    const now = new Date();
    // Find the next prayer in sequence to determine if current has passed
    const currentIndex = PRAYER_ORDER.indexOf(prayer.id.toLowerCase());
    const nextIndex = PRAYER_ORDER.indexOf(nextPrayer?.name.toLowerCase() || 'fajr');

    // If next prayer index is greater, current has passed
    // Handle wraparound (after isha, before fajr)
    if (nextIndex === 0 && currentIndex !== 0) {
      return true; // All prayers have passed, next is tomorrow's fajr
    }
    return currentIndex < nextIndex;
  };

  return (
    <div id="prayer-list" className="space-y-4 mb-2">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-bold text-lg text-neutral-primary">{t('todaysPrayers')}</h3>
        {isTravelMode && (
          <span className="text-[10px] sm:text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/30 rounded-full px-2 py-1 font-semibold">
            {t('travelModeActive')}
          </span>
        )}
      </div>

      {prayersWithRealTimes.map((prayer) => {
        const isNextPrayer = prayer.isNext;
        const isPast = hasPassed(prayer);
        const isShuruk = prayer.isShuruk;
        const isMissed = prayer.status === PrayerStatus.Missed;

        return (
          <div
            key={prayer.id}
            onClick={() => !isShuruk && onPrayerClick(prayer)}
            className={`
              relative overflow-hidden group transform-gpu
              rounded-3xl transition-all duration-500
              ${isShuruk ? 'cursor-default opacity-90' : 'cursor-pointer'}
              ${isNextPrayer
                ? 'bg-brand-surface shadow-[0_0_20px_rgba(4,120,87,0.1)] scale-[1.02] z-10 animate-[pulse_2s_ease-in-out_infinite]'
                : isMissed
                  ? 'bg-red-500/10'
                  : 'bg-brand-surface hover:shadow-sm hover:-translate-y-0.5'
              }
            `}
          >
            {/* Gradient Border Visualization */}
            {!isShuruk && (
              <div className={`absolute top-0 bottom-0 w-1.5 transition-all duration-300 z-10
                ${dir === 'rtl' ? 'right-0' : 'left-0'}
                ${isMissed ? 'bg-gradient-to-b from-red-500/80 to-red-400/50' : 
                  prayer.status === PrayerStatus.Upcoming ? (isNextPrayer ? 'bg-gradient-to-b from-brand-primary to-brand-primary/40 shadow-[0_0_8px_rgba(4,120,87,0.6)]' : 'bg-transparent') : 
                  'bg-gradient-to-b from-brand-primary to-brand-secondary'}
              `}></div>
            )}

            {/* Background Image */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 ${isMissed ? 'opacity-20 mix-blend-luminosity' : ''}`}
              style={{ backgroundImage: `url(${PRAYER_IMAGES[prayer.id.toLowerCase()] || PRAYER_IMAGES.fajr})` }}
            />
            {/* No overlay - full image visibility unless missed */}

            <div className="relative p-4 flex items-center justify-between z-10 gap-3 h-full">
              <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse min-w-0 flex-1 z-20">
                <div className="min-w-0 bg-white/40 dark:bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-soft-xl flex flex-col justify-center">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="font-extrabold text-neutral-900 dark:text-white text-lg tracking-tight">
                      {['ar', 'ur'].includes(language) ? prayer.arabicName : prayer.name}
                    </span>
                    <span className="text-sm text-neutral-800/80 dark:text-neutral-200/80 font-arabic hidden sm:inline-block">
                      {['ar', 'ur'].includes(language) ? prayer.name : prayer.arabicName}
                    </span>
                    {isNextPrayer && (
                      <span className="text-[10px] bg-brand-primary text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm animate-in fade-in ml-2">
                        {t('next_prayer' as any)}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-mono tracking-tight font-black mt-0.5 ${isNextPrayer ? 'text-brand-primary drop-shadow-sm' : 'text-neutral-800 dark:text-neutral-200'}`}>
                    {prayer.time}
                  </span>
                </div>
              </div>

              {/* Push metadata icons to right */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse ml-auto z-10">
                {/* Metadata Icons - Hide for Shuruk */}
                {!isShuruk && prayer.khushuRating !== undefined && prayer.khushuRating !== null && (
                  <div className="flex items-center space-x-0.5 rtl:space-x-reverse text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Star size={10} className="fill-current" />
                    <span className="text-[10px] font-bold">{prayer.khushuRating}</span>
                  </div>
                )}
                {/* Pen/Edit Icon - Hide for Shuruk */}
                {!isShuruk && (
                <div className={`hidden sm:block p-1.5 rounded-full transition-colors ${prayer.journalEntry
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'bg-gray-50 text-gray-300 group-hover:bg-brand-primary/5 group-hover:text-brand-primary/60'
                    }`}>
                    <Edit3 size={12} />
                  </div>
                )}

                {/* Status Badge - Special for Shuruk */}
                {isShuruk ? (
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200">
                    <span className="text-amber-500">☀️</span>
                    <span className="hidden sm:inline">Sunrise</span>
                  </div>
                ) : (
                  <div className={`
                      flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border
                      ${prayer.status === PrayerStatus.Missed
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : prayer.status === PrayerStatus.QadaDone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-brand-subtle text-brand-muted border-brand-border'}
                    `}
                  >
                    {getStatusIcon(prayer.status)}
                    <span className="hidden sm:inline">{getStatusLabel(prayer.status)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar Background for generic list items - Optional */}
            {isNextPrayer && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-brand-primary/20 w-full">
                <div className="h-full bg-brand-primary w-1/3 animate-pulse"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
