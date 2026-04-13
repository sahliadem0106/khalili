
import React from 'react';
import { IMAGES } from '../constants';
import { ArrowRight, ArrowLeft, Moon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Hero: React.FC = () => {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div id="hero-section" className="relative overflow-hidden rounded-3xl bg-brand-primary text-white shadow-soft mb-6 mx-1">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={IMAGES.pattern}
          alt="Pattern"
          className="w-full h-full object-cover opacity-10 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary/90"></div>

        {/* Decorative Circle */}
        <div className="absolute -top-10 -right-10 rtl:right-auto rtl:-left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 rtl:left-auto rtl:-right-10 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white/20 backdrop-blur-md rounded-full px-3 py-1 border border-white/10">
            <Moon size={14} className="text-brand-accent fill-brand-accent" />
            <span className="text-xs font-semibold tracking-wide uppercase">{t('appName')}</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold leading-tight mb-2 tracking-tight">
          {t('heroTitle')}
        </h1>
        <p className="text-white/90 text-sm mb-6 max-w-[80%] font-medium">
          {t('heroSubtitle')}
        </p>

        <button className="self-start group flex items-center space-x-2 rtl:space-x-reverse bg-brand-accent text-brand-surface px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all">
          <span>{t('heroAction')}</span>
          <ArrowIcon size={16} className="group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
