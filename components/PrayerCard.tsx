/**
 * PrayerCard - Displays next prayer with real-time countdown
 * Now uses real calculated prayer times instead of hardcoded values
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Clock, MapPin, Settings2, Loader2 } from 'lucide-react';
import { IMAGES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { UsePrayerTimesReturn } from '../hooks/usePrayerTimes';
import { LocationPicker } from './LocationPicker';
import { prayerTimesService } from '../services/PrayerTimesService';

const PRAYER_NAMES_AR: Record<string, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

interface PrayerCardProps {
  prayerData: UsePrayerTimesReturn;
}

export const PrayerCard: React.FC<PrayerCardProps> = ({ prayerData }) => {
  const { t, language, dir } = useLanguage();
  const {
    prayerTimes,
    nextPrayer,
    location,
    hijriDate,
    isLoading,
    locationLoading,
    refreshLocation,
    setManualLocation,
  } = prayerData;

  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [countdown, setCountdown] = useState<string>('');

  // Update countdown every second
  useEffect(() => {
    if (!nextPrayer) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextPrayer.time.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Now');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (language === 'ar') {
        if (hours > 0) {
          setCountdown(`${hours}س ${minutes}د`);
        } else {
          setCountdown(`${minutes}د ${seconds}ث`);
        }
      } else {
        if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m`);
        } else {
          setCountdown(`${minutes}m ${seconds}s`);
        }
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [nextPrayer, language]);

  // Handle location selection from picker
  const handleLocationSelect = (newLocation: any) => {
    setManualLocation(
      newLocation.latitude,
      newLocation.longitude,
      newLocation.city,
      newLocation.country
    );
  };

  // Get prayer name in current language
  const getPrayerName = (name: string) => {
    if (language === 'ar') {
      return PRAYER_NAMES_AR[name.toLowerCase()] || name;
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return prayerTimesService.formatTime(date, false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div id="next-prayer-card" className="mb-6">
        <div className="card-premium p-8 flex items-center justify-center min-h-[200px]">
          <Loader2 size={24} className="text-brand-primary animate-spin" />
          <span className="ms-2 text-brand-muted">Loading Prayer Times...</span>
        </div>
      </div>
    );
  }

  // Show location prompt if no Location set
  if (!location) {
    return (
      <div id="next-prayer-card" className="mb-6">
        <div className="card-premium p-8 text-center">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-primary">
            <MapPin size={32} />
          </div>
          <h3 className="font-bold text-xl text-brand-forest mb-2">
            {t('set_location_title')}
          </h3>
          <p className="text-brand-muted mb-6 max-w-xs mx-auto leading-relaxed">
            {t('set_location_desc')}
          </p>
          <Button onClick={() => setIsLocationPickerOpen(true)} className="btn btn-primary px-8">
            <MapPin size={18} className="me-2" />
            {t('set_location_btn')}
          </Button>
        </div>

        <LocationPicker
          isOpen={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          onLocationSelect={handleLocationSelect}
          currentLocation={location}
        />
      </div>
    );
  }

  return (
    <div id="next-prayer-card" className="mb-6">
      <div className="card-premium relative p-6 sm:p-8 overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <div>
            {/* Header with Hijri Date */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary shadow-sm border border-brand-primary/20">
                <Clock size={16} />
              </span>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                {t('nextPrayer')}
              </span>
            </div>

            {/* Next Prayer Info OR Completion Message */}
            {nextPrayer ? (
              <>
                <h2 className="text-5xl font-extrabold text-brand-forest mb-1 tracking-tight">
                  {formatTime(nextPrayer.time)}
                </h2>
                <p className="text-xl text-brand-muted font-medium mb-4">
                  {getPrayerName(nextPrayer.name)}
                </p>
              </>
            ) : (
              <div className="py-2 mb-4">
                <h2 className="text-2xl font-bold text-brand-forest mb-1">
                  {t('day_completed')}
                </h2>
                <p className="text-brand-muted font-medium leading-relaxed">
                  {t('day_completed_desc')}
                </p>
              </div>
            )}

            {/* Hijri Date */}
            {hijriDate && (
              <p className="text-sm text-brand-muted/80 font-medium mb-6">
                {language === 'ar'
                  ? `${hijriDate.day} ${hijriDate.monthNameAr}، ${hijriDate.year} هـ`
                  : hijriDate.formatted}
              </p>
            )}

            {/* Countdown Badge - Only if next prayer exists */}
            {nextPrayer && (
              <div className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse"></span>
                <span className="text-sm font-bold">
                  {countdown || '--'} {t('remaining')}
                </span>
              </div>
            )}

            {/* Location Button */}
            <div>
              <button
                onClick={() => setIsLocationPickerOpen(true)}
                className="group flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-medium text-brand-muted hover:text-brand-primary transition-colors py-1 px-2 rounded-lg hover:bg-brand-primary/5 -ms-2 antialiased"
              >
                <MapPin size={14} className="group-hover:scale-110 transition-transform" />
                <span>{location.city || 'Unknown'}</span>
                <Settings2 size={12} className="opacity-50" />
              </button>
            </div>
          </div>

          {/* Image Container - Decorative */}
          <div className={`absolute -top-6 w-40 h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 rotate-6 transition-transform hover:rotate-3 ${dir === 'rtl' ? '-left-6' : '-right-6'
            }`}>
            <img
              src={IMAGES.mosqueCard}
              alt="Mosque"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <LocationPicker
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={location}
      />
    </div>
  );
};
