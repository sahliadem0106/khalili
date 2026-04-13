import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Moon, Sun, Globe, ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppearanceSettingsProps {
    onBack: () => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ onBack }) => {
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="flex flex-col h-full bg-brand-surface">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-brand-primary/10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-brand-primary/5 active:bg-brand-primary/10 transition-colors"
                >
                    <ArrowLeft size={24} className="text-brand-primary" />
                </button>
                <h2 className="text-xl font-bold ml-4 text-brand-forest">
                    {t('profile_appearance_lang')}
                </h2>
            </div>

            <div className="p-5 space-y-8 overflow-y-auto">

                {/* Language Section */}
                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        {t('settings_language')}
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border ${language === 'en'
                                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <span className="font-bold">En</span>
                                </div>
                                <div className="text-left rtl:text-right">
                                    <div className="font-semibold text-brand-forest">English</div>
                                    <div className="text-xs text-neutral-500">English</div>
                                </div>
                            </div>
                            {language === 'en' && <Check className="text-brand-primary" size={20} />}
                        </button>

                        <button
                            onClick={() => setLanguage('ar')}
                            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border ${language === 'ar'
                                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <span className="font-bold text-lg">ع</span>
                                </div>
                                <div className="text-left rtl:text-right">
                                    <div className="font-semibold text-brand-forest">العربية</div>
                                    <div className="text-xs text-neutral-500">Arabic</div>
                                </div>
                            </div>
                            {language === 'ar' && <Check className="text-brand-primary" size={20} />}
                        </button>

                        <button
                            onClick={() => setLanguage('fr')}
                            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border ${language === 'fr'
                                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <span className="font-bold">Fr</span>
                                </div>
                                <div className="text-left rtl:text-right">
                                    <div className="font-semibold text-brand-forest">Français</div>
                                    <div className="text-xs text-neutral-500">French</div>
                                </div>
                            </div>
                            {language === 'fr' && <Check className="text-brand-primary" size={20} />}
                        </button>

                        <button
                            onClick={() => setLanguage('tr')}
                            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border ${language === 'tr'
                                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                    <span className="font-bold">Tr</span>
                                </div>
                                <div className="text-left rtl:text-right">
                                    <div className="font-semibold text-brand-forest">Türkçe</div>
                                    <div className="text-xs text-neutral-500">Turkish</div>
                                </div>
                            </div>
                            {language === 'tr' && <Check className="text-brand-primary" size={20} />}
                        </button>

                        <button
                            onClick={() => setLanguage('ur')}
                            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border ${language === 'ur'
                                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <span className="font-bold text-lg">أ</span>
                                </div>
                                <div className="text-left rtl:text-right">
                                    <div className="font-semibold text-brand-forest">اردو</div>
                                    <div className="text-xs text-neutral-500">Urdu</div>
                                </div>
                            </div>
                            {language === 'ur' && <Check className="text-brand-primary" size={20} />}
                        </button>

                        <button
                            onClick={() => setLanguage('id')}
                            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border ${language === 'id'
                                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                                    <span className="font-bold">Id</span>
                                </div>
                                <div className="text-left rtl:text-right">
                                    <div className="font-semibold text-brand-forest">Bahasa Indonesia</div>
                                    <div className="text-xs text-neutral-500">Indonesian</div>
                                </div>
                            </div>
                            {language === 'id' && <Check className="text-brand-primary" size={20} />}
                        </button>
                    </div>
                </section>

                {/* Theme Section (Visual Only for now as requested by user context of "Restoring" but logic might be missing) */}
                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        {t('settings_theme')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/30 relative overflow-hidden group">
                            <div className="flex flex-col items-center py-2">
                                <Sun className="text-brand-primary mb-2" size={32} />
                                <span className="font-medium text-brand-forest">{t('settings_theme_light')}</span>
                            </div>
                            <div className="absolute top-2 right-2">
                                <Check className="text-brand-primary" size={16} />
                            </div>
                        </button>
                        <button className="p-4 rounded-xl bg-white border border-gray-100 relative overflow-hidden group opacity-50 cursor-not-allowed">
                            <div className="flex flex-col items-center py-2">
                                <Moon className="text-neutral-400 mb-2" size={32} />
                                <span className="font-medium text-neutral-400">{t('settings_theme_dark')}</span>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0">
                                <Check className="text-neutral-400" size={16} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-black/10 px-2 py-1 rounded">{t('settings_coming_soon')}</span>
                            </div>
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
};
