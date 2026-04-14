/**
 * AdhanOverlay - Premium Adhan Experience
 * Features: Glassmorphism, Animations, Reminder Integration
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, VolumeX, Send, Check, Users, Home, CircleDot } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { audioService } from '../services/AudioService';

interface AdhanOverlayProps {
    isOpen: boolean;
    prayerName: string;
    prayerNameAr: string;
    shouldPlaySound?: boolean; // New prop
    onClose: () => void;
    onRemind: (target: 'partner' | 'family' | 'circle') => void;
}

export const AdhanOverlay: React.FC<AdhanOverlayProps> = ({
    isOpen,
    prayerName,
    prayerNameAr,
    shouldPlaySound = true, // Default to true
    onClose,
    onRemind,
}) => {
    const { t, language } = useLanguage();
    const [showRemindOptions, setShowRemindOptions] = useState(false);
    const [requiresUserTap, setRequiresUserTap] = useState(false);

    // Audio Effect - Play when opened if shouldPlaySound is true
    // Audio Effect - Play when opened if shouldPlaySound is true
    React.useEffect(() => {
        let mounted = true;
        let timer: NodeJS.Timeout;

        if (isOpen && shouldPlaySound) {
            // Use a small timeout to ensure initial rendering is done
            timer = setTimeout(() => {
                if (!mounted) return;

                audioService.playAdhan(() => {
                    if (mounted) {
                        onClose(); // Auto-dismiss when finished
                    }
                });
                setRequiresUserTap(audioService.isAutoplayBlocked());
            }, 100);
        }

        return () => {
            mounted = false;
            // Stop audio if component unmounts mid-playback
            audioService.stopAdhan();
            if (timer) clearTimeout(timer);
        };
    }, [isOpen, shouldPlaySound]);

    // Stop audio and close
    const handleStop = () => {
        audioService.stopAdhan();
        onClose();
    };

    const handleManualPlay = async () => {
        const started = await audioService.playAdhan(() => onClose());
        if (started) {
            setRequiresUserTap(false);
        }
    };

    const handleRemindClick = () => setShowRemindOptions(true);

    // Placeholder handler
    const handleRemindSelect = (target: 'partner' | 'family' | 'circle') => {
        onRemind(target);
        setShowRemindOptions(false);
    };

    const displayName = language === 'ar' ? prayerNameAr : prayerName;
    const subName = language === 'ar' ? prayerName : prayerNameAr;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background Layer with Blur & Gradient */}
                    <div className="absolute inset-0 bg-brand-forest/90 backdrop-blur-3xl z-0" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-brand-forest/20 to-black/60 z-0" />

                    {/* Abstract Decorative Elements */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] border-[2px] border-white/10 rounded-full z-0"
                    />

                    {/* Content Container */}
                    <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center justify-between h-[85vh]">

                        {/* Top: Dismiss Button & Live Indicator */}
                        <div className="w-full flex justify-between items-start pt-6">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/5 backdrop-blur-md"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-xs font-medium text-white/90 uppercase tracking-wider">{t('adhan_live')}</span>
                            </motion.div>

                            <button
                                onClick={handleStop}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Center: Prayer Time Display */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="text-center space-y-4"
                        >
                            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-6 py-2 inline-block shadow-2xl shadow-brand-gold/10">
                                <span className="text-brand-gold/90 text-sm font-medium uppercase tracking-[0.2em]">
                                    {t('adhan_time_for')}
                                </span>
                            </div>

                            <div className="relative">
                                <h1 className="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 font-arabic drop-shadow-lg py-2">
                                    {displayName}
                                </h1>
                                <motion.p
                                    className="text-2xl text-white/50 font-light font-arabic"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {subName}
                                </motion.p>
                            </div>
                        </motion.div>

                        {/* Bottom: Action Buttons */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="w-full space-y-3"
                        >
                            {requiresUserTap && (
                                <button
                                    onClick={handleManualPlay}
                                    className="w-full rounded-2xl bg-brand-primary text-white font-bold text-lg h-14 flex items-center justify-center hover:bg-brand-primary/90 transition-all active:scale-95 border border-white/10"
                                >
                                    {t('tap_to_play_adhan' as any) || 'Tap to play Adhan'}
                                </button>
                            )}
                            <button
                                onClick={handleStop}
                                className="w-full group relative overflow-hidden rounded-2xl bg-white text-brand-forest font-bold text-lg h-14 flex items-center justify-center shadow-xl shadow-white/5 hover:shadow-white/10 transition-all active:scale-95"
                            >
                                <div className="absolute inset-0 bg-brand-gold/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                                <div className="relative flex items-center gap-3">
                                    <VolumeX size={22} className="text-brand-forest" />
                                    <span>{t('adhan_stop')}</span>
                                </div>
                            </button>

                            <button
                                onClick={handleRemindClick}
                                className="w-full rounded-2xl bg-white/10 border border-white/10 text-white font-medium text-lg h-14 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-3">
                                    <Bell size={22} />
                                    <span>{t('adhan_remind_others')}</span>
                                </div>
                            </button>
                        </motion.div>
                    </div>

                    {/* Reminder Options Modal / Sheet */}
                    <AnimatePresence>
                        {showRemindOptions && (
                            <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowRemindOptions(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
                                >
                                    {/* Modal Header */}
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-white">
                                            {t('adhan_send_reminder')}
                                        </h3>
                                        <button onClick={() => setShowRemindOptions(false)} className="bg-white/10 p-2 rounded-full">
                                            <X size={18} className="text-white" />
                                        </button>
                                    </div>

                                    {/* Mock List - Will connect to backend later */}
                                    <div className="space-y-3">
                                        {[
                                            { id: 'partner', label: t('adhan_partner'), icon: Users, color: 'bg-blue-500/20 text-blue-400' },
                                            { id: 'family', label: t('adhan_family_group'), icon: Home, color: 'bg-purple-500/20 text-purple-400' },
                                            { id: 'circle', label: t('adhan_suhba_circle'), icon: CircleDot, color: 'bg-green-500/20 text-green-400' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleRemindSelect(item.id as any)}
                                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-full ${item.color}`}>
                                                        <item.icon size={20} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-semibold text-white">{item.label}</p>
                                                        <p className="text-xs text-white/50">{t('adhan_tap_notify')}</p>
                                                    </div>
                                                </div>
                                                <Send size={18} className="text-white/30 group-hover:text-brand-gold transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
