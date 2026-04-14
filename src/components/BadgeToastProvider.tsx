import React, { useEffect, useState } from 'react';
import { BadgeService, UserBadge } from '../services/BadgeService';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Award } from 'lucide-react';

export const BadgeToastProvider: React.FC = () => {
    const { language, t } = useLanguage();
    const [openBadges, setOpenBadges] = useState<UserBadge[]>([]);
    const [currentBadge, setCurrentBadge] = useState<UserBadge | null>(null);

    // Poll for new badges since localStorage isn't easily watchable across tabs reliably
    useEffect(() => {
        const interval = setInterval(() => {
            const progress = BadgeService.getProgress();
            if (!progress) return;

            const newBadges = progress.badges.filter(b => b.isNew);
            if (newBadges.length > 0) {
                // If we found new badges not currently in our local state, add them to queue
                setOpenBadges(prev => {
                    const diff = newBadges.filter(nb => !prev.find(p => p.badgeId === nb.badgeId) && currentBadge?.badgeId !== nb.badgeId);
                    return [...prev, ...diff];
                });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [currentBadge]);

    // Handle shifting the queue
    useEffect(() => {
        if (!currentBadge && openBadges.length > 0) {
            setCurrentBadge(openBadges[0]);
            setOpenBadges(prev => prev.slice(1));
        }
    }, [currentBadge, openBadges]);

    // Close the current badge toast
    const handleClose = () => {
        if (currentBadge) {
            BadgeService.markBadgeSeen(currentBadge.badgeId);
            setCurrentBadge(null);
        }
    };

    if (!currentBadge) return null;

    // Get Badge Definition
    const badgeDef = BadgeService.getBadgesByCategory('prayer').concat(
        BadgeService.getBadgesByCategory('social'),
        BadgeService.getBadgesByCategory('study'),
        BadgeService.getBadgesByCategory('tasbih')
    ).find(b => b.id === currentBadge.badgeId);

    if (!badgeDef) {
        handleClose();
        return null;
    }

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:w-96 z-50 animate-fade-in-up">
            <div className="bg-white dark:bg-brand-surface rounded-2xl shadow-2xl border border-yellow-400 dark:border-yellow-500/30 overflow-hidden relative">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 rtl:left-2 rtl:right-auto p-1.5 bg-white/10 dark:bg-black/20 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full text-neutral-500 transition-colors z-10"
                >
                    <X size={16} />
                </button>

                {/* Content */}
                <div className="p-4 flex items-center space-x-4 rtl:space-x-reverse bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 p-0.5 shadow-inner flex-shrink-0 flex items-center justify-center text-3xl">
                        {badgeDef.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                            <Award size={14} className="text-orange-500 dark:text-orange-400" />
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                                {language === 'ar' ? 'وسام جديد!' : 'Badge Unlocked!'}
                            </span>
                        </div>
                        <h3 className="font-bold text-neutral-900 dark:text-white truncate">
                            {language === 'ar' ? badgeDef.nameAr : badgeDef.name}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                            {language === 'ar' ? badgeDef.descriptionAr : badgeDef.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
