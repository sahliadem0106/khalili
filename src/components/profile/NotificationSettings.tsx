import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ArrowLeft, Bell, BellOff, Volume2 } from 'lucide-react';

interface NotificationSettingsProps {
    onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
    const { language, t } = useLanguage();

    // NOTE: In a real app, this would use the useNotifications hook or service
    // For now, we simulate state locally as the hook might need context we don't fully have
    const [settings, setSettings] = useState({
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
        reminderBefore: 15,
    });

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

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
                    {t('settings_notifications')}
                </h2>
            </div>

            <div className="p-5 overflow-y-auto space-y-8">

                {/* Adhan Settings */}
                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        {t('profile_adhan_alerts')}
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                        {PRAYERS.map((prayer) => (
                            <div key={prayer} className="flex items-center justify-between p-4">
                                <div className="capitalize font-medium text-brand-forest">{t(prayer as any)}</div>
                                <button
                                    onClick={() => toggle(prayer as any)}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${settings[prayer as keyof typeof settings] ? 'bg-brand-primary' : 'bg-neutral-200'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings[prayer as keyof typeof settings]
                                        ? 'left-6' // Basic flip for LTR, RTL needs CSS dir handling or specific start/end
                                        : 'left-1'
                                        }`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Global Settings */}
                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        {t('profile_global_settings')}
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <Bell size={16} />
                                </div>
                                <span className="font-medium text-brand-forest">{t('settings_pre_prayer')}</span>
                            </div>
                            <select
                                className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-brand-forest font-medium outline-none focus:ring-2 focus:ring-brand-primary/20"
                                value={settings.reminderBefore}
                                onChange={(e) => setSettings(prev => ({ ...prev, reminderBefore: Number(e.target.value) }))}
                            >
                                <option value={0}>{t('settings_off')}</option>
                                <option value={5}>{t('settings_before_5')}</option>
                                <option value={10}>{t('settings_before_10')}</option>
                                <option value={15}>{t('settings_before_15')}</option>
                                <option value={30}>{t('settings_before_30')}</option>
                            </select>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};
