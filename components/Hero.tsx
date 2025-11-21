
import React from 'react';
import { IMAGES } from '../constants';
import { ArrowRight, ArrowLeft, Moon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Hero: React.FC = () => {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div id="hero-section" className="relative overflow-hidden rounded-3xl bg-brand-forest text-white shadow-lg mb-6">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={IMAGES.pattern} 
          alt="Pattern" 
          className="w-full h-full object-cover opacity-10 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-forest via-brand-teal to-brand-forest/90"></div>
        
        {/* Decorative Circle */}
        <div className="absolute -top-10 -right-10 rtl:right-auto rtl:-left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <Moon size={14} className="text-yellow-300 fill-yellow-300" />
            <span className="text-xs font-semibold tracking-wide uppercase">{t('appName')}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold leading-tight mb-1">
          {t('heroTitle')}
        </h1>
        <p className="text-brand-mint text-sm mb-5 max-w-[70%]">
          {t('heroSubtitle')}
        </p>

        <button className="self-start group flex items-center space-x-2 rtl:space-x-reverse bg-white text-brand-forest px-5 py-2.5 rounded-full text-sm font-bold shadow-md active:scale-95 transition-transform">
          <span>{t('heroAction')}</span>
          <ArrowIcon size={16} className="group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
