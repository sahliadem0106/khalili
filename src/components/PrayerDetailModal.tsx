import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle2, Clock, Home, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { Prayer, PrayerStatus, BarrierType } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { prayerLogService } from '../services/PrayerLogService';
import { motion, AnimatePresence } from 'framer-motion';

interface PrayerDetailModalProps {
  prayer: Prayer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Prayer>) => void;
}

export const PrayerDetailModal: React.FC<PrayerDetailModalProps> = ({ prayer, isOpen, onClose, onSave }) => {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<PrayerStatus>(PrayerStatus.Upcoming);
  const [khushu, setKhushu] = useState<number>(0);
  const [barrier, setBarrier] = useState<BarrierType>('none');
  const [journal, setJournal] = useState('');
  const [isTravelMode, setIsTravelMode] = useState(false);
  const TRAVEL_MODE_KEY = 'khalil_travel_mode';

  const BARRIERS: { id: BarrierType; label: string }[] = [
    { id: 'sleep', label: t('barrier_sleep') },
    { id: 'work', label: t('barrier_work') },
    { id: 'procrastination', label: t('barrier_procrastination') },
    { id: 'travel', label: t('barrier_travel') },
    { id: 'forgetfulness', label: t('barrier_forgetfulness') },
  ];

  // Status label translation helper
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

  useEffect(() => {
    if (prayer) {
      setStatus(prayer.status);
      setKhushu(prayer.khushuRating || 0);
      setBarrier(prayer.barrier || 'none');
      setJournal(prayer.journalEntry || '');
    }
  }, [prayer]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      setIsTravelMode(localStorage.getItem(TRAVEL_MODE_KEY) === 'true');
    } catch {
      setIsTravelMode(false);
    }
  }, [isOpen]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSave = () => {
    if (!prayer) return;
    const barrierValue = status === PrayerStatus.Missed || status === PrayerStatus.Late ? barrier : 'none';

    // Update the prayer in the UI state
    onSave(prayer.id, {
      status,
      khushuRating: khushu,
      barrier: barrierValue,
      journalEntry: journal
    });

    // Log to PrayerLogService for persistent tracking
    // Only log if status is not "upcoming" (an actual prayer action)
    if (status !== PrayerStatus.Upcoming) {
      prayerLogService.logPrayer(
        prayer.id,
        status,
        khushu, // 0 = not rated, 1-5 = rating
        barrierValue === 'none' ? null : barrierValue
      );
    }

    onClose();
  };

  const isCompleted = [PrayerStatus.Jamaah, PrayerStatus.Home, PrayerStatus.Late, PrayerStatus.QadaDone].includes(status);
  const isMissedOrLate = [PrayerStatus.Missed, PrayerStatus.Late].includes(status);
  const isQasrEligiblePrayer = prayer && ['dhuhr', 'asr', 'isha'].includes(prayer.id.toLowerCase());

  return (
    <AnimatePresence>
      {isOpen && prayer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 200 }}
          className="fixed inset-0 flex items-end sm:items-center justify-center backdrop-blur-sm bg-brand-forest/60"
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-brand-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/20 max-h-[90vh] pb-safe-bottom overflow-hidden flex flex-col"
          >
            {/* Header - Forest Green Gradient */}
            <div className="bg-gradient-to-br from-brand-primary to-brand-primary-dark px-5 py-4 border-b border-white/5 flex justify-between items-center rounded-t-3xl shadow-sm shrink-0">
              <div className="text-white">
                <h3 className="text-2xl font-black tracking-tight">{['ar', 'ur'].includes(language) ? prayer.arabicName : prayer.name}</h3>
                <div className="flex items-center gap-2 opacity-90 mt-0.5">
                  <Clock size={12} />
                  <p className="text-xs font-bold font-mono tracking-widest">{prayer.time}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white backdrop-blur-md">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-brand-surface overflow-y-auto flex-1">
              {isTravelMode && (
                <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-3.5">
                  <p className="text-sm font-semibold text-brand-primary">
                    {t('travelMode')}: {t('travelModeActive')}
                  </p>
                  <p className="text-xs text-brand-muted mt-1">
                    {isQasrEligiblePrayer
                      ? 'Qasr guidance: this prayer is usually shortened during travel.'
                      : 'This prayer is not typically shortened in Qasr.'}
                  </p>
                </div>
              )}

              {/* Status Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black text-brand-muted uppercase tracking-widest px-1">{t('insights')} (Status)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[PrayerStatus.Upcoming, PrayerStatus.Jamaah, PrayerStatus.Home, PrayerStatus.Late, PrayerStatus.Missed, PrayerStatus.QadaDone].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`
                        flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-200 border
                        ${status === s
                          ? 'bg-transparent border-2 border-brand-primary text-brand-primary font-black shadow-sm scale-[1.02]'
                          : 'bg-brand-subtle border-brand-border text-brand-forest hover:border-brand-primary/20 hover:bg-brand-subtle/80 font-bold'}
                      `}
                    >
                      <span className="text-xs">{getStatusLabel(s)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Section: Khushu (Focus) */}
              {isCompleted && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex justify-between items-baseline px-1">
                    <label className="text-xs font-black text-brand-muted uppercase tracking-widest">{t('detail_khushu')}</label>
                    <span className="text-xs text-brand-primary font-bold">{t('detail_khushu_desc')}</span>
                  </div>
                  <div className="flex justify-between bg-brand-subtle p-4 rounded-2xl border border-brand-primary/10 shadow-inner">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setKhushu(star)} className="transition-transform hover:scale-110 active:scale-95 group">
                        <Star
                          size={32}
                          className={`transition-colors ${star <= khushu ? "fill-brand-secondary text-brand-secondary drop-shadow-md" : "text-brand-border group-hover:text-brand-secondary/50"}`}
                        />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Conditional Section: Barrier Identification */}
              {isMissedOrLate && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex justify-between items-baseline px-1">
                    <label className="text-xs font-black text-red-500 uppercase tracking-widest">{t('detail_barrier')}</label>
                    <span className="text-xs text-red-400 font-bold">{t('detail_barrier_desc')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {BARRIERS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBarrier(b.id)}
                        className={`
                          px-4 py-2.5 rounded-full text-xs font-bold border transition-all
                          ${barrier === b.id
                            ? 'bg-red-50 border-red-200 text-red-600 shadow-sm ring-2 ring-red-200/50'
                            : 'bg-white border-brand-border text-brand-muted hover:border-red-100 hover:text-red-400'}
                        `}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reflection Journal */}
              <div className="space-y-3">
                <label className="text-xs font-black text-brand-muted uppercase tracking-widest px-1">{t('detail_reflection')}</label>
                <textarea
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder={t('detail_reflection_placeholder')}
                  className="w-full h-32 bg-white dark:bg-black/20 rounded-2xl p-4 text-sm font-medium border border-brand-border text-brand-forest placeholder:text-brand-muted/70 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary focus:outline-none resize-none shadow-sm"
                />
              </div>

              <div className="pt-2">
                <Button fullWidth size="lg" onClick={handleSave} className="bg-brand-primary text-white hover:bg-brand-primary-dark shadow-xl shadow-brand-primary/30 rounded-2xl py-4 font-black text-base tracking-widest uppercase">
                  {t('detail_update_btn')}
                </Button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
