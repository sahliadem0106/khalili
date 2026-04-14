/**
 * SettingsModal - App settings configuration modal
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    Bell,
    Clock,
    MapPin,
    Moon,
    Globe,
    Volume2,
    ChevronRight,
    Check,
    Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { tafsirService, POPULAR_TRANSLATIONS, POPULAR_TAFSIRS } from '../services/TafsirService';
import { quranAudioService, POPULAR_RECITERS } from '../services/QuranAudioService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsSection = 'main' | 'calculation' | 'notifications' | 'appearance' | 'quran';

// Calculation methods
const CALCULATION_METHODS = [
    { id: 'MuslimWorldLeague', name: 'Muslim World League' },
    { id: 'Egyptian', name: 'Egyptian General Authority' },
    { id: 'Karachi', name: 'University of Islamic Sciences, Karachi' },
    { id: 'UmmAlQura', name: 'Umm al-Qura, Makkah' },
    { id: 'Dubai', name: 'Dubai' },
    { id: 'MoonsightingCommittee', name: 'Moonsighting Committee' },
    { id: 'NorthAmerica', name: 'Islamic Society of North America' },
    { id: 'Kuwait', name: 'Kuwait' },
    { id: 'Qatar', name: 'Qatar' },
    { id: 'Singapore', name: 'Singapore' },
    { id: 'Tehran', name: 'Institute of Geophysics, Tehran' },
    { id: 'Turkey', name: 'Diyanet, Turkey' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { t, language, setLanguage, dir } = useLanguage();
    const { user, updateSettings, isLoading } = useAuth();

    const [section, setSection] = useState<SettingsSection>('main');
    const [isSaving, setIsSaving] = useState(false);

    // Local state for settings
    const [settings, setSettings] = useState({
        calculationMethod: 'MuslimWorldLeague',
        asrMethod: 'shafi' as 'shafi' | 'hanafi',
        notificationsEnabled: true,
        reminderTiming: 'atTime' as string,
        theme: 'light' as 'light' | 'dark' | 'auto',
        preferredReciterId: 7,
        preferredTranslationId: 131,
        preferredTafsirId: 169,
        audioAutoPlay: false,
        audioRepeatVerse: false,
        audioRepeatCount: 1,
        audioShowTranslation: true,
    });

    // Load settings from user profile
    useEffect(() => {
        const audioSettings = quranAudioService.getSettings();
        if (user?.settings) {
            setSettings({
                calculationMethod: user.settings.calculationMethod || 'MuslimWorldLeague',
                asrMethod: user.settings.asrMethod || 'shafi',
                notificationsEnabled: user.settings.notificationsEnabled ?? true,
                reminderTiming: user.settings.reminderTiming || 'atTime',
                theme: user.settings.theme || 'light',
                preferredReciterId: user.settings.preferredReciterId || 7,
                preferredTranslationId: user.settings.preferredTranslationId || 131,
                preferredTafsirId: user.settings.preferredTafsirId || 169,
                audioAutoPlay: audioSettings.autoPlay,
                audioRepeatVerse: audioSettings.repeatVerse,
                audioRepeatCount: audioSettings.repeatCount,
                audioShowTranslation: audioSettings.showTranslation,
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            quranAudioService.updateSettings({
                autoPlay: settings.audioAutoPlay,
                repeatVerse: settings.audioRepeatVerse,
                repeatCount: settings.audioRepeatCount,
                showTranslation: settings.audioShowTranslation,
            });
            tafsirService.setTafsir(settings.preferredTafsirId);
            tafsirService.setTranslation(settings.preferredTranslationId);
            await updateSettings(settings as any);
            onClose();
        } catch (e) {
            console.error('Failed to save settings:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (!isOpen) return null;

    const renderMainSection = () => (
        <div className="space-y-2">
            {/* Calculation Method */}
            <button
                onClick={() => setSection('calculation')}
                className="w-full flex items-center justify-between p-4 hover:bg-brand-subtle rounded-xl transition-colors border border-transparent hover:border-brand-border"
            >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                        <Clock size={18} className="text-brand-primary" />
                    </div>
                    <div className="text-start">
                        <p className="font-medium text-brand-forest">
                            {t('settings_calc_method')}
                        </p>
                        <p className="text-sm text-brand-muted">
                            {CALCULATION_METHODS.find(m => m.id === settings.calculationMethod)?.name}
                        </p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 rtl:rotate-180" />
            </button>

            {/* Notifications */}
            <button
                onClick={() => setSection('notifications')}
                className="w-full flex items-center justify-between p-4 hover:bg-brand-subtle rounded-xl transition-colors border border-transparent hover:border-brand-border"
            >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Bell size={18} className="text-blue-400" />
                    </div>
                    <div className="text-start">
                        <p className="font-medium text-brand-forest">
                            {t('settings_notifications')}
                        </p>
                        <p className="text-sm text-brand-muted">
                            {settings.notificationsEnabled
                                ? t('enabled')
                                : t('disabled')}
                        </p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 rtl:rotate-180" />
            </button>

            {/* Appearance */}
            <button
                onClick={() => setSection('appearance')}
                className="w-full flex items-center justify-between p-4 hover:bg-brand-subtle rounded-xl transition-colors border border-transparent hover:border-brand-border"
            >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Moon size={18} className="text-purple-400" />
                    </div>
                    <div className="text-start">
                        <p className="font-medium text-brand-forest">
                            {t('settings_appearance')}
                        </p>
                        <p className="text-sm text-brand-muted">
                            {settings.theme === 'light' && t('settings_light' as any)}
                            {settings.theme === 'dark' && t('settings_dark' as any)}
                            {settings.theme === 'auto' && t('settings_auto' as any)}
                        </p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 rtl:rotate-180" />
            </button>

            {/* Language */}
            <div className="w-full flex items-center justify-between p-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <Globe size={18} className="text-orange-400" />
                    </div>
                    <div className="text-start">
                        <p className="font-medium text-brand-forest">
                            {t('settings_language')}
                        </p>
                    </div>
                </div>
                <div className="flex bg-brand-subtle p-1 rounded-lg border border-brand-border">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${language === 'en' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:text-brand-forest'
                            }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage('ar')}
                        className={`px-3 py-1.5 text-sm font-arabic font-medium rounded-md transition-colors ${language === 'ar' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:text-brand-forest'
                            }`}
                    >
                        العربية
                    </button>
                </div>
            </div>

            {/* Quran Settings */}
            <button
                onClick={() => setSection('quran')}
                className="w-full flex items-center justify-between p-4 hover:bg-brand-subtle rounded-xl transition-colors border border-transparent hover:border-brand-border"
            >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Volume2 size={18} className="text-emerald-400" />
                    </div>
                    <div className="text-start">
                        <p className="font-medium text-brand-forest">
                            {t('settings_quran')}
                        </p>
                        <p className="text-sm text-brand-muted">
                            {t('settings_reciter')}
                        </p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 rtl:rotate-180" />
            </button>
        </div>
    );

    const renderCalculationSection = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400 px-2">
                    {t('settings_calc_method')}
                </p>
                {CALCULATION_METHODS.map(method => (
                    <button
                        key={method.id}
                        onClick={() => updateSetting('calculationMethod', method.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${settings.calculationMethod === method.id
                            ? 'bg-brand-primary/20 border border-brand-primary/50'
                            : 'hover:bg-brand-subtle border border-transparent'
                            }`}
                    >
                        <span className={`text-sm ${settings.calculationMethod === method.id
                            ? 'font-medium text-brand-primary'
                            : 'text-white'
                            }`}>
                            {method.name}
                        </span>
                        {settings.calculationMethod === method.id && (
                            <Check size={16} className="text-brand-primary" />
                        )}
                    </button>
                ))}
            </div>

                <div className="border-t border-brand-border pt-4 space-y-2">
                <p className="text-sm font-medium text-neutral-400 px-2">
                    {t('settings_asr_calc')}
                </p>
                <div className="flex space-x-2 rtl:space-x-reverse px-2">
                    <button
                        onClick={() => updateSetting('asrMethod', 'shafi')}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${settings.asrMethod === 'shafi'
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-subtle text-brand-muted hover:bg-brand-subtle/80'
                            }`}
                    >
                        {t('settings_shafi')}
                    </button>
                    <button
                        onClick={() => updateSetting('asrMethod', 'hanafi')}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${settings.asrMethod === 'hanafi'
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-subtle text-brand-muted hover:bg-brand-subtle/80'
                            }`}
                    >
                        {t('settings_hanafi')}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderNotificationsSection = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-2">
                <span className="font-medium text-brand-forest">
                    {t('settings_enable_notif')}
                </span>
                <button
                    onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
                    className={`w-12 h-7 rounded-full transition-colors ${settings.notificationsEnabled ? 'bg-brand-primary' : 'bg-neutral-600'
                        }`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-1 ${settings.notificationsEnabled ? 'translate-x-5 rtl:-translate-x-5' : ''
                        }`} />
                </button>
            </div>

            {settings.notificationsEnabled && (
                <div className="space-y-2 pt-2 border-t border-brand-border">
                    <p className="text-sm font-medium text-neutral-400 px-2">
                        {t('settings_reminder_timing')}
                    </p>
                    {[
                        { id: 'atTime', label: t('settings_at_time') },
                        { id: 'before5', label: t('settings_before_5') },
                        { id: 'before10', label: t('settings_before_10') },
                        { id: 'before15', label: t('settings_before_15') },
                        { id: 'before30', label: t('settings_before_30') },
                    ].map(timing => (
                        <button
                            key={timing.id}
                            onClick={() => updateSetting('reminderTiming', timing.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${settings.reminderTiming === timing.id
                                ? 'bg-brand-primary/20 border border-brand-primary/50'
                                : 'hover:bg-brand-subtle border border-transparent'
                                }`}
                        >
                            <span className={`text-sm ${settings.reminderTiming === timing.id
                                ? 'font-medium text-brand-primary'
                                : 'text-brand-forest'
                                }`}>
                                {timing.label}
                            </span>
                            {settings.reminderTiming === timing.id && (
                                <Check size={16} className="text-brand-primary" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAppearanceSection = () => (
        <div className="space-y-4">
            <p className="text-sm font-medium text-neutral-400 px-2">
                {t('settings_theme')}
            </p>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'light', icon: '☀️', label: t('settings_light' as any) },
                    { id: 'dark', icon: '🌙', label: t('settings_dark' as any) },
                    { id: 'auto', icon: '🌓', label: t('settings_auto' as any) },
                ].map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => updateSetting('theme', theme.id as 'light' | 'dark' | 'auto')}
                        className={`p-4 rounded-xl border-2 transition-all ${settings.theme === theme.id
                            ? 'border-brand-primary bg-brand-primary/20 text-white'
                            : 'border-brand-border hover:border-brand-border/80 text-brand-muted'
                            }`}
                    >
                        <span className="text-2xl block mb-2">{theme.icon}</span>
                        <span className={`text-sm font-medium ${settings.theme === theme.id ? 'text-brand-primary' : ''
                            }`}>
                            {theme.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderSection = () => {
        switch (section) {
            case 'calculation':
                return renderCalculationSection();
            case 'notifications':
                return renderNotificationsSection();
            case 'appearance':
                return renderAppearanceSection();
            case 'quran':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-neutral-400 px-2">Reciter</p>
                            {POPULAR_RECITERS.map(reciter => (
                                <button
                                    key={reciter.id}
                                    onClick={() => {
                                        updateSetting('preferredReciterId', reciter.id);
                                        quranAudioService.setReciter(reciter.id);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                                        settings.preferredReciterId === reciter.id
                                            ? 'bg-brand-primary/20 border border-brand-primary/50'
                                            : 'hover:bg-brand-subtle border border-transparent'
                                    }`}
                                >
                                    <span className={`text-sm ${
                                        settings.preferredReciterId === reciter.id
                                            ? 'font-medium text-brand-primary'
                                            : 'text-brand-forest'
                                    }`}>
                                        {reciter.englishName}
                                    </span>
                                    {settings.preferredReciterId === reciter.id && (
                                        <Check size={16} className="text-brand-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2 pt-4 border-t border-brand-border">
                            <p className="text-sm font-medium text-neutral-400 px-2">Translation</p>
                            {POPULAR_TRANSLATIONS.map(translation => (
                                <button
                                    key={translation.id}
                                    onClick={() => {
                                        updateSetting('preferredTranslationId', translation.id as any);
                                        tafsirService.setTranslation(translation.id);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                                        settings.preferredTranslationId === translation.id
                                            ? 'bg-brand-primary/20 border border-brand-primary/50'
                                            : 'hover:bg-brand-subtle border border-transparent'
                                    }`}
                                >
                                    <span className={`text-sm ${
                                        settings.preferredTranslationId === translation.id
                                            ? 'font-medium text-brand-primary'
                                            : 'text-brand-forest'
                                    }`}>
                                        {translation.translatedName.name}
                                    </span>
                                    {settings.preferredTranslationId === translation.id && (
                                        <Check size={16} className="text-brand-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2 pt-4 border-t border-brand-border">
                            <p className="text-sm font-medium text-neutral-400 px-2">Tafsir</p>
                            {POPULAR_TAFSIRS.map(source => (
                                <button
                                    key={source.id}
                                    onClick={() => {
                                        updateSetting('preferredTafsirId', source.id as any);
                                        tafsirService.setTafsir(source.id);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                                        settings.preferredTafsirId === source.id
                                            ? 'bg-brand-primary/20 border border-brand-primary/50'
                                            : 'hover:bg-brand-subtle border border-transparent'
                                    }`}
                                >
                                    <span className={`text-sm ${
                                        settings.preferredTafsirId === source.id
                                            ? 'font-medium text-brand-primary'
                                            : 'text-brand-forest'
                                    }`}>
                                        {source.translatedName.name}
                                    </span>
                                    {settings.preferredTafsirId === source.id && (
                                        <Check size={16} className="text-brand-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-3 pt-4 border-t border-brand-border">
                            <p className="text-sm font-medium text-neutral-400 px-2">Audio Behavior</p>
                            <div className="flex items-center justify-between p-2">
                                <span className="text-sm text-brand-forest">Auto play next verse</span>
                                <button
                                    onClick={() => updateSetting('audioAutoPlay', !settings.audioAutoPlay)}
                                    className={`w-12 h-7 rounded-full transition-colors ${settings.audioAutoPlay ? 'bg-brand-primary' : 'bg-neutral-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-1 ${settings.audioAutoPlay ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-2">
                                <span className="text-sm text-brand-forest">Repeat verse</span>
                                <button
                                    onClick={() => updateSetting('audioRepeatVerse', !settings.audioRepeatVerse)}
                                    className={`w-12 h-7 rounded-full transition-colors ${settings.audioRepeatVerse ? 'bg-brand-primary' : 'bg-neutral-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-1 ${settings.audioRepeatVerse ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-2">
                                <span className="text-sm text-brand-forest">Show translation by default</span>
                                <button
                                    onClick={() => updateSetting('audioShowTranslation', !settings.audioShowTranslation)}
                                    className={`w-12 h-7 rounded-full transition-colors ${settings.audioShowTranslation ? 'bg-brand-primary' : 'bg-neutral-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-1 ${settings.audioShowTranslation ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return renderMainSection();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="bg-brand-surface w-full max-h-[90vh] sm:max-h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-glass border border-brand-border animate-in slide-in-from-bottom duration-300 relative z-10 flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
                    {section !== 'main' ? (
                        <button
                            onClick={() => setSection('main')}
                            className="p-2 -ml-2 hover:bg-brand-subtle rounded-full"
                        >
                            <ChevronRight size={20} className="text-brand-muted rotate-180 rtl:rotate-0" />
                        </button>
                    ) : (
                        <div className="w-8" />
                    )}

                    <h3 className="font-bold text-brand-forest text-lg">
                        {section === 'main' && t('settings_title')}
                        {section === 'calculation' && t('settings_calc')}
                        {section === 'notifications' && t('settings_notifications')}
                        {section === 'appearance' && t('settings_appearance')}
                        {section === 'quran' && t('settings_quran')}
                    </h3>

                    <button onClick={onClose} className="p-2 -mr-2 hover:bg-brand-subtle rounded-full">
                        <X size={20} className="text-brand-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {renderSection()}
                </div>

                {/* Footer */}
                {section !== 'main' && (
                    <div className="px-5 py-4 border-t border-brand-border flex-shrink-0">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-3.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center shadow-lg shadow-brand-primary/20"
                        >
                            {isSaving ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                t('settings_save_changes')
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
