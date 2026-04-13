import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ArrowLeft, Clock, MapPin, Check } from 'lucide-react';
import { CALCULATION_METHOD_OPTIONS, prayerTimesService, PrayerTimesSettings } from '../../services/PrayerTimesService';

interface PrayerSettingsProps {
    onBack: () => void;
}

export const PrayerSettings: React.FC<PrayerSettingsProps> = ({ onBack }) => {
    const { language, t } = useLanguage();
    const [settings, setSettings] = useState<PrayerTimesSettings>(prayerTimesService.loadSettings());

    // Save settings when changed
    useEffect(() => {
        prayerTimesService.saveSettings(settings);
        prayerTimesService.clearCache(); // Clear cache to force recalculation
    }, [settings]);

    return (
        <div className="flex flex-col h-full bg-brand-surface">
            <div className="flex items-center p-4 border-b border-brand-primary/10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-brand-primary/5 active:bg-brand-primary/10 transition-colors"
                >
                    <ArrowLeft size={24} className="text-brand-primary" />
                </button>
                <h2 className="text-xl font-bold ml-4 text-brand-forest">
                    {t('profile_prayer_config')}
                </h2>
            </div>

            <div className="p-5 overflow-y-auto space-y-8">

                {/* Calculation Method */}
                <section>
                    <div className="flex items-center mb-4 px-1">
                        <Clock size={16} className="text-brand-primary mr-2 rtl:ml-2" />
                        <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider">
                            {t('settings_calc_method')}
                        </h3>
                    </div>

                    <div className="space-y-2">
                        {CALCULATION_METHOD_OPTIONS.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setSettings(prev => ({ ...prev, calculationMethod: method.id }))}
                                className={`w-full p-4 rounded-xl flex items-center justify-between text-left rtl:text-right transition-all border ${settings.calculationMethod === method.id
                                    ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                    : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold text-brand-forest">{t(`calc_${method.id}` as any)}</div>
                                    <div className="text-xs text-neutral-500 mt-0.5">{t(`calc_${method.id}_region` as any)}</div>
                                </div>
                                {settings.calculationMethod === method.id && (
                                    <Check className="text-brand-primary shrink-0 ml-3 rtl:mr-3" size={20} />
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Asr Juristic Method */}
                <section>
                    <div className="flex items-center mb-4 px-1">
                        <MapPin size={16} className="text-brand-primary mr-2 rtl:ml-2" />
                        <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider">
                            {t('settings_asr_calc')}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, asrJuristic: 'standard' }))}
                            className={`p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${settings.asrJuristic === 'standard'
                                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            <span className="font-semibold text-brand-forest">{t('asr_standard')}</span>
                            <span className="text-xs text-neutral-500 mt-1">{t('asr_majority')}</span>
                            {settings.asrJuristic === 'standard' && <div className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                        </button>

                        <button
                            onClick={() => setSettings(prev => ({ ...prev, asrJuristic: 'hanafi' }))}
                            className={`p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${settings.asrJuristic === 'hanafi'
                                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-md'
                                : 'bg-white border-transparent hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            <span className="font-semibold text-brand-forest">{t('settings_hanafi')}</span>
                            <span className="text-xs text-neutral-500 mt-1">{t('asr_hanafi_school')}</span>
                            {settings.asrJuristic === 'hanafi' && <div className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                        </button>
                    </div>
                </section>

                {/* Manual Adjustments Note */}
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100/50">
                    <p className="text-xs text-orange-700 leading-relaxed text-center">
                        {t('settings_manual_note')}
                    </p>
                </div>

            </div>
        </div>
    );
};
