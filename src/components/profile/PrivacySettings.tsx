import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowLeft, Eye, EyeOff, Shield, Users } from 'lucide-react';

interface PrivacySettingsProps {
    onBack: () => void;
}

const PRIVACY_STORAGE_KEY = 'khalil_privacy_settings';

interface PrivacySettingsData {
    shareStreak: boolean;
    sharePrayers: boolean;
    shareHeartState: boolean;
    publicProfile: boolean;
}

const DEFAULT_SETTINGS: PrivacySettingsData = {
    shareStreak: true,
    sharePrayers: true,
    shareHeartState: false,
    publicProfile: false,
};

function loadPrivacySettings(): PrivacySettingsData {
    try {
        const stored = localStorage.getItem(PRIVACY_STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error('Failed to load privacy settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
}

function savePrivacySettings(settings: PrivacySettingsData): void {
    try {
        localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save privacy settings:', e);
    }
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onBack }) => {
    const { language, t } = useLanguage();

    // Load persisted settings on mount
    const [settings, setSettings] = useState<PrivacySettingsData>(loadPrivacySettings);

    // Persist to localStorage whenever settings change
    useEffect(() => {
        savePrivacySettings(settings);
    }, [settings]);

    const toggle = (key: keyof PrivacySettingsData) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

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
                    {t('profile_rakib_privacy')}
                </h2>
            </div>

            <div className="p-5 overflow-y-auto space-y-8">

                {/* Visibility Settings */}
                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        {t('profile_data_visibility')}
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-6">

                        <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                <div className="mt-1 text-brand-primary">
                                    {settings.shareStreak ? <Eye size={20} /> : <EyeOff size={20} />}
                                </div>
                                <div>
                                    <div className="font-medium text-brand-forest">{t('privacy_share_streak')}</div>
                                    <div className="text-xs text-neutral-500 max-w-[200px]">{t('privacy_share_streak_desc')}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggle('shareStreak')}
                                className={`relative w-12 h-7 rounded-full transition-colors ${settings.shareStreak ? 'bg-brand-primary' : 'bg-neutral-200'
                                    }`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.shareStreak ? 'left-6' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                <div className="mt-1 text-brand-primary">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-brand-forest">{t('privacy_share_prayers')}</div>
                                    <div className="text-xs text-neutral-500 max-w-[200px]">{t('privacy_share_prayers_desc')}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggle('sharePrayers')}
                                className={`relative w-12 h-7 rounded-full transition-colors ${settings.sharePrayers ? 'bg-brand-primary' : 'bg-neutral-200'
                                    }`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.sharePrayers ? 'left-6' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                <div className="mt-1 text-brand-primary">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-brand-forest">{t('privacy_public_profile')}</div>
                                    <div className="text-xs text-neutral-500 max-w-[200px]">{t('privacy_public_profile_desc')}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggle('publicProfile')}
                                className={`relative w-12 h-7 rounded-full transition-colors ${settings.publicProfile ? 'bg-brand-primary' : 'bg-neutral-200'
                                    }`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.publicProfile ? 'left-6' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                    </div>
                </section>

                <div className="p-4 bg-blue-50 rounded-xl flex items-start space-x-3 rtl:space-x-reverse">
                    <Shield className="text-blue-500 shrink-0 mt-1" size={20} />
                    <p className="text-sm text-blue-700 leading-relaxed">
                        {t('privacy_data_notice')}
                    </p>
                </div>

            </div>
        </div>
    );
};
