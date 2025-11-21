
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Clock, MapPin } from 'lucide-react';
import { IMAGES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface PrayerCardProps {
  nextPrayerName: string;
  nextPrayerTime: string;
  currentTimeStr: string;
}

export const PrayerCard: React.FC<PrayerCardProps> = ({ nextPrayerName, nextPrayerTime }) => {
  const { t, language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      const [hours, minutes] = nextPrayerTime.split(':').map(Number);
      target.setHours(hours, minutes, 0);
      
      if (target < now) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const m = Math.floor((diff / 1000 / 60) % 60);
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      
      const hStr = language === 'ar' ? 'س' : 'h';
      const mStr = language === 'ar' ? 'د' : 'm';
      
      setTimeLeft(`${h}${hStr} ${m}${mStr}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [nextPrayerTime, language]);

  return (
    <div id="next-prayer-card">
      <Card className="mb-6 relative overflow-visible border border-brand-mint/50">
        <div className="flex justify-between items-start">
          <div className="z-10">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-mint text-brand-forest">
                <Clock size={14} />
              </span>
              <span className="text-sm font-medium text-brand-forest uppercase tracking-wider">{t('nextPrayer')}</span>
            </div>
            
            <h2 className="text-4xl font-bold text-neutral-primary mb-1">{nextPrayerTime}</h2>
            {/* For Arabic we often want the Arabic name, but this prop comes from parent. 
                Ideally we translate it here or parent passes translated. 
                Assuming parent passes English for now, we might map it if strictly needed, 
                but the Prayer object has arabicName. We'll assume visual consistency for now. */}
            <p className="text-lg text-neutral-muted font-medium mb-4">{nextPrayerName}</p>
            
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 mb-5">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-orange-700">
                {timeLeft || "53m"} {t('remaining')}
              </span>
            </div>

            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/20">
              {t('setRoutine')}
            </Button>
          </div>

          {/* Image Container */}
          <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-32 h-40 rounded-xl overflow-hidden shadow-md rotate-3 rtl:-rotate-3 border-2 border-white">
            <img 
              src={IMAGES.mosqueCard} 
              alt="Mosque" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
               <div className="flex items-center text-white/90">
                  <MapPin size={10} className="me-1" />
                  <span className="text-[10px] font-medium truncate">{t('nearestMosque')}</span>
               </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
