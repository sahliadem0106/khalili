/**
 * NotificationPermission - First-launch prompt for notification permissions
 */

import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationPermissionProps {
    onComplete: () => void;
}

const STORAGE_KEY = 'khalil_notification_prompted';

export const NotificationPermission: React.FC<NotificationPermissionProps> = ({ onComplete }) => {
    const { t, language } = useLanguage();
    const { permissionStatus, requestPermission, isSupported } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    // Check if we should show the prompt
    useEffect(() => {
        const hasBeenPrompted = localStorage.getItem(STORAGE_KEY);

        // Show prompt if:
        // 1. Notifications are supported
        // 2. Permission hasn't been granted or denied yet
        // 3. User hasn't been prompted before
        if (isSupported && permissionStatus === 'default' && !hasBeenPrompted) {
            // Delay showing the prompt for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSupported, permissionStatus]);

    const handleEnable = async () => {
        setIsRequesting(true);
        await requestPermission();
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsRequesting(false);
        setIsVisible(false);
        onComplete();
    };

    const handleSkip = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsVisible(false);
        onComplete();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="absolute inset-0"
                onClick={handleSkip}
            />

            <div className="bg-brand-surface border border-brand-border w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 bg-brand-mint rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={28} className="text-brand-forest" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-brand-forest text-center mb-2">
                    {t('notif_enable_title')}
                </h2>

                {/* Description */}
                <p className="text-brand-muted text-center text-sm mb-6">
                    {t('notif_enable_desc')}
                </p>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                    {[
                        { en: t('notif_alert_before'), ar: t('notif_alert_before') },
                        { en: t('notif_missed_reminders'), ar: t('notif_missed_reminders') },
                        { en: t('notif_optional_adhan'), ar: t('notif_optional_adhan') },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="w-5 h-5 bg-brand-forest/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check size={12} className="text-brand-forest" />
                            </div>
                            <span className="text-sm text-brand-forest">
                                {item.en}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <Button
                        fullWidth
                        onClick={handleEnable}
                        disabled={isRequesting}
                        className="h-12"
                    >
                        {isRequesting ? (
                            <>
                                <Loader2 size={18} className="me-2 animate-spin" />
                                {t('notif_enabling')}
                            </>
                        ) : (
                            <>
                                <Bell size={18} className="me-2" />
                                {t('notif_enable_btn')}
                            </>
                        )}
                    </Button>

                    <button
                        onClick={handleSkip}
                        className="w-full py-3 text-sm text-brand-muted hover:text-brand-forest transition-colors"
                    >
                        {t('not_now')}
                    </button>
                </div>

                {/* Privacy Note */}
                <p className="text-[10px] text-brand-muted text-center mt-4">
                    {t('notif_change_later')}
                </p>
            </div>
        </div >
    );
};
