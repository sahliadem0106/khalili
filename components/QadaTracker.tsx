
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Plane, CheckCircle2, AlertCircle } from 'lucide-react';
import { QadaStats } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface QadaTrackerProps {
  stats: QadaStats;
}

export const QadaTracker: React.FC<QadaTrackerProps> = ({ stats }) => {
  const [isTravelMode, setIsTravelMode] = useState(false);
  const { t } = useLanguage();
  const percentage = Math.min(100, Math.round((stats.madeUp / (stats.totalMissed || 1)) * 100));

  return (
    <div className="space-y-4 mb-6">
      {/* Qada Stats Card */}
      <Card className="bg-neutral-card border border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-neutral-primary">{t('missedPrayers')}</h3>
          <span className="text-xs font-medium text-brand-forest bg-brand-mint dark:bg-brand-forest/20 px-2 py-1 rounded-md">
            {t('makeUp')}
          </span>
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-neutral-muted">{t('progress')}</span>
              <span className="font-medium text-neutral-primary">{stats.madeUp} / {stats.totalMissed}</span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-forest rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 flex items-center space-x-3 rtl:space-x-reverse border border-red-100 dark:border-red-900/30">
             <AlertCircle size={18} className="text-red-500" />
             <div>
               <p className="text-xs text-red-400 font-medium uppercase">{t('pending')}</p>
               <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.totalMissed - stats.madeUp}</p>
             </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center space-x-3 rtl:space-x-reverse border border-blue-100 dark:border-blue-900/30">
             <CheckCircle2 size={18} className="text-blue-500" />
             <div>
               <p className="text-xs text-blue-400 font-medium uppercase">{t('completed')}</p>
               <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.madeUp}</p>
             </div>
          </div>
        </div>
      </Card>

      {/* Travel Mode Card */}
      <Card className={`transition-all duration-300 ${isTravelMode ? 'bg-brand-forest text-white' : 'bg-neutral-card text-neutral-primary'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className={`p-2 rounded-full ${isTravelMode ? 'bg-white/20' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
              <Plane size={20} className={isTravelMode ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'} />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t('travelMode')}</h3>
              <p className={`text-xs ${isTravelMode ? 'text-brand-mint' : 'text-neutral-muted'}`}>
                {isTravelMode ? t('travelModeActive') : t('travelModeDesc')}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsTravelMode(!isTravelMode)}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${isTravelMode ? 'bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
          >
            <div 
              className={`bg-white dark:bg-neutral-400 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isTravelMode ? 'translate-x-5 rtl:-translate-x-5 bg-brand-forest dark:bg-brand-forest' : 'translate-x-0'}`}
            >
                {isTravelMode && <div className="w-full h-full rounded-full bg-brand-forest"></div>}
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
};
