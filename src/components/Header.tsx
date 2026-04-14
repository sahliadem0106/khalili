
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Edit2, X } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export interface HeaderProps {
  user: User;
  onHelpClick?: () => void;
  locationName?: string;
  onRefreshLocation?: () => void;
  isLocationLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onHelpClick,
  locationName,
  onRefreshLocation,
  isLocationLoading
}) => {
  const { t, language } = useLanguage();
  const [quote, setQuote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedQuote = localStorage.getItem('muslimDaily_quote');
    setQuote(savedQuote || t('quote_hardship') || 'Verily, with hardship comes ease.');
  }, [t]);

  const handleSave = () => {
    setIsEditing(false);
    localStorage.setItem('muslimDaily_quote', quote);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  return (
    <header className="pt-3 pb-1 px-1" id="app-header">
      {/* Daily Reminder Card - Wide Banner */}
      <div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-forest via-brand-primary to-teal-800 shadow-soft-xl group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] animate-in fade-in zoom-in-[0.98] duration-700"
        onClick={() => setIsEditing(true)}
      >
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay pointer-events-none" />

        {/* Decorative Quote Mark */}
        <div className="absolute -top-4 -right-2 text-white/5 pointer-events-none rotate-12">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
          </svg>
        </div>

        <div className="relative z-10 px-4 py-3">
          {/* Header Row: Label & Location */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/10 shadow-sm">
              <Sparkles size={12} className="text-amber-300" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-100/90">
                {t('daily_reminder')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Location Badge (Compact) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshLocation && onRefreshLocation();
                }}
                disabled={isLocationLoading}
                className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 hover:bg-black/30 transition-colors"
                title="Refresh Location"
              >
                <div className={`text-emerald-300 ${isLocationLoading ? 'animate-spin' : ''}`}>
                  {isLocationLoading ? (
                    <div className="w-2.5 h-2.5 border-2 border-emerald-300 border-t-transparent rounded-full" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/90 max-w-[80px] truncate">
                  {isLocationLoading ? '...' : (locationName || user.location || 'Locating')}
                </span>
              </button>

              <Edit2 size={14} className="text-white/40 opacity-0 group-hover:opacity-100 transition-all hover:text-white" />
            </div>
          </div>

          {/* Content (Read Only) */}
          <div className="flex items-center">
            <p
              className={`text-base md:text-lg text-white drop-shadow-sm leading-snug font-medium ${language === 'ar'
                ? 'font-quran text-right w-full leading-normal'
                : 'font-sans italic'
                }`}
            >
              "{quote}"
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {/* Edit Modal - Portalled to body for correct positioning */}
      {isEditing && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-brand-surface border border-brand-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 to-brand-primary p-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Edit2 size={18} />
                {t('edit_reminder') || 'Daily Intention'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              <label className="block text-sm font-medium text-brand-forest mb-2">
                {t('set_intention') || 'Enter something you want to remember:'}
              </label>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder={t('write_reminder') || "Write your note here..."}
                className="w-full h-32 p-3 bg-brand-subtle border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all resize-none text-base font-medium text-brand-forest placeholder:text-brand-muted"
                autoFocus
              />

              {/* Modal Footer */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-brand-border text-brand-muted font-medium hover:bg-brand-subtle transition-colors"
                >
                  {t('close') || 'Close'}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/30 hover:bg-brand-primary-dark transition-all active:scale-95"
                >
                  {t('save_note') || 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
