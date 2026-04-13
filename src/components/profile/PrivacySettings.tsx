import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ArrowLeft, Eye, EyeOff, Shield, Users } from 'lucide-react';

interface PrivacySettingsProps {
    onBack: () => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onBack }) => {
    const { language, t } = useLanguage();

    // NOTE: Simulated state for Rakib/Privacy settings
    const [settings, setSettings] = useState({
        shareStreak: true,
        sharePrayers: true,
        shareHeartState: false,
        publicProfile: false,
    });

    const toggle = (key: keyof typeof settings) => {
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
