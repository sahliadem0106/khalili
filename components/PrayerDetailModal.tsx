import React, { useState, useEffect } from 'react';
import { X, Star, AlertTriangle, CheckCircle2, Clock, Home, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { Prayer, PrayerStatus, BarrierType } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface PrayerDetailModalProps {
  prayer: Prayer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Prayer>) => void;
}

const BARRIERS: { id: BarrierType; label: string }[] = [
  { id: 'sleep', label: 'Overslept' },
  { id: 'work', label: 'Work/School' },
  { id: 'procrastination', label: 'Procrastination' },
  { id: 'travel', label: 'Travel' },
  { id: 'forgetfulness', label: 'Forgot' },
];

export const PrayerDetailModal: React.FC<PrayerDetailModalProps> = ({ prayer, isOpen, onClose, onSave }) => {
  const [status, setStatus] = useState<PrayerStatus>(PrayerStatus.Upcoming);
  const [khushu, setKhushu] = useState<number>(0);
  const [barrier, setBarrier] = useState<BarrierType>('none');
  const [journal, setJournal] = useState('');

  useEffect(() => {
    if (prayer) {
      setStatus(prayer.status);
      setKhushu(prayer.khushuRating || 0);
      setBarrier(prayer.barrier || 'none');
      setJournal(prayer.journalEntry || '');
    }
  }, [prayer]);

  if (!isOpen || !prayer) return null;

  const handleSave = () => {
    onSave(prayer.id, {
      status,
      khushuRating: khushu,
      barrier: status === PrayerStatus.Missed || status === PrayerStatus.Late ? barrier : 'none',
      journalEntry: journal
    });
    onClose();
  };

  const isCompleted = [PrayerStatus.Jamaah, PrayerStatus.Home, PrayerStatus.Late, PrayerStatus.QadaDone].includes(status);
  const isMissedOrLate = [PrayerStatus.Missed, PrayerStatus.Late].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-body w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        
        <div className="bg-white p-6 border-b border-neutral-line sticky top-0 z-10 flex justify-between items-center rounded-t-3xl">
          <div>
            <h3 className="text-xl font-bold text-neutral-primary">{prayer.name} Prayer</h3>
            <p className="text-sm text-neutral-muted font-arabic">{prayer.arabicName} • {prayer.time}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
            <X size={24} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Status Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-primary uppercase tracking-wide">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[PrayerStatus.Jamaah, PrayerStatus.Home, PrayerStatus.Late, PrayerStatus.Missed, PrayerStatus.QadaDone].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border transition-all
                    ${status === s ? `${STATUS_COLORS[s]} border-transparent shadow-md` : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}
                  `}
                >
                  <span className="text-xs font-bold">{STATUS_LABELS[s]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Section: Khushu (Focus) */}
          {isCompleted && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-baseline">
                 <label className="text-sm font-bold text-neutral-primary uppercase tracking-wide">Khushu (Presence)</label>
                 <span className="text-xs text-neutral-muted">How focused were you?</span>
              </div>
              <div className="flex justify-between bg-white p-4 rounded-2xl border border-neutral-line">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setKhushu(star)} className="transition-transform hover:scale-110 active:scale-95">
                    <Star 
                      size={28} 
                      className={star <= khushu ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"} 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Section: Barrier Identification */}
          {isMissedOrLate && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-baseline">
                 <label className="text-sm font-bold text-red-500 uppercase tracking-wide">Identify Barrier</label>
                 <span className="text-xs text-neutral-muted">Why did this happen?</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BARRIERS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBarrier(b.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${barrier === b.id ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white border-neutral-200 text-neutral-500'}
                    `}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reflection Journal */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-primary uppercase tracking-wide">Reflection</label>
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Briefly note your feelings or spiritual state..."
              className="w-full h-24 bg-white rounded-xl p-4 text-sm border border-neutral-line focus:ring-2 focus:ring-brand-teal focus:outline-none resize-none placeholder:text-neutral-300"
            />
          </div>

          <Button fullWidth size="lg" onClick={handleSave}>
            Update Prayer Log
          </Button>

        </div>
      </div>
    </div>
  );
};
