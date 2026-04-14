/**
 * BadgesSection - Displays user's earned badges on profile
 */

import React, { useState, useEffect } from 'react';
import { BadgeService, BadgeDefinition, BADGE_DEFINITIONS, BadgeCategory } from '../../services/BadgeService';
import { Award, Trophy, Star, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface BadgesSectionProps {
    compact?: boolean; // Show fewer badges for compact view
}

export const BadgesSection: React.FC<BadgesSectionProps> = ({ compact = false }) => {
    const { language } = useLanguage();
    const [earnedBadges, setEarnedBadges] = useState<(BadgeDefinition & { earnedAt: string })[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
    const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

    useEffect(() => {
        const earned = BadgeService.getEarnedBadges();
        setEarnedBadges(earned);
    }, []);

    const categories: { key: BadgeCategory | 'all'; label: string; labelAr: string }[] = [
        { key: 'all', label: 'All', labelAr: 'الكل' },
        { key: 'prayer', label: 'Prayer', labelAr: 'الصلاة' },
        { key: 'study', label: 'Study', labelAr: 'الدراسة' },
        { key: 'tasbih', label: 'Tasbih', labelAr: 'التسبيح' },
        { key: 'social', label: 'Social', labelAr: 'الاجتماعي' },
    ];

    const filteredBadges = selectedCategory === 'all'
        ? BADGE_DEFINITIONS
        : BADGE_DEFINITIONS.filter(b => b.category === selectedCategory);

    const displayBadges = compact ? filteredBadges.slice(0, 6) : filteredBadges;

    const isEarned = (badgeId: string) => earnedBadges.some(b => b.id === badgeId);

    const getTierGradient = (tier: string) => {
        switch (tier) {
            case 'bronze': return 'from-amber-600 to-orange-700';
            case 'silver': return 'from-gray-300 to-gray-500';
            case 'gold': return 'from-yellow-400 to-amber-500';
            case 'platinum': return 'from-indigo-200 to-purple-300';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-amber-500" />
                    <h3 className="text-lg font-bold text-brand-forest">
                        {language === 'ar' ? 'الإنجازات' : 'Achievements'}
                    </h3>
                </div>
                <span className="text-sm text-brand-muted">
                    {earnedBadges.length}/{BADGE_DEFINITIONS.length}
                </span>
            </div>

            {/* Category Tabs */}
            {!compact && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.key
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-brand-subtle text-brand-muted border border-brand-border'
                                }`}
                        >
                            {language === 'ar' ? cat.labelAr : cat.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Badge Grid */}
            <div className="grid grid-cols-3 gap-3">
                {displayBadges.map(badge => {
                    const earned = isEarned(badge.id);
                    const progress = BadgeService.getBadgeProgress(badge.id);

                    return (
                        <motion.button
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative p-4 rounded-2xl flex flex-col items-center text-center transition-all ${earned
                                    ? `bg-gradient-to-br ${getTierGradient(badge.tier)} shadow-lg`
                                    : 'bg-neutral-100 dark:bg-neutral-800 opacity-60'
                                }`}
                        >
                            {/* Badge Icon */}
                            <div className="text-3xl mb-2">
                                {earned ? badge.icon : <Lock size={24} className="text-neutral-400" />}
                            </div>

                            {/* Badge Name */}
                            <span className={`text-xs font-medium line-clamp-2 ${earned ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'
                                }`}>
                                {language === 'ar' ? badge.nameAr : badge.name}
                            </span>

                            {/* Progress Bar (if not earned) */}
                            {!earned && progress && (
                                <div className="absolute bottom-2 left-2 right-2">
                                    <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-primary rounded-full transition-all"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* New Badge Indicator */}
                            {earned && earnedBadges.find(b => b.id === badge.id)?.earnedAt && (
                                <div className="absolute -top-1 -right-1">
                                    <Star size={16} className="text-yellow-300 fill-yellow-300" />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Badge Detail Modal */}
            <AnimatePresence>
                {selectedBadge && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setSelectedBadge(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-brand-surface border border-brand-border rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <div className="text-center">
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 ${isEarned(selectedBadge.id)
                                        ? `bg-gradient-to-br ${getTierGradient(selectedBadge.tier)}`
                                        : 'bg-neutral-100 dark:bg-neutral-800'
                                    }`}>
                                    {isEarned(selectedBadge.id) ? selectedBadge.icon : <Lock size={32} className="text-neutral-400" />}
                                </div>

                                <h3 className="text-xl font-bold text-brand-forest mb-2">
                                    {language === 'ar' ? selectedBadge.nameAr : selectedBadge.name}
                                </h3>

                                <p className="text-brand-muted mb-4">
                                    {language === 'ar' ? selectedBadge.descriptionAr : selectedBadge.description}
                                </p>

                                {/* Progress */}
                                {!isEarned(selectedBadge.id) && (
                                    <div className="mb-4">
                                        {(() => {
                                            const progress = BadgeService.getBadgeProgress(selectedBadge.id);
                                            if (!progress) return null;
                                            return (
                                                <div className="space-y-2">
                                                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-brand-primary rounded-full transition-all"
                                                            style={{ width: `${progress.percentage}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-neutral-500">
                                                        {progress.current} / {progress.target}
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Tier */}
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedBadge.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                        selectedBadge.tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                                            selectedBadge.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                                                'bg-amber-100 text-amber-700'
                                    }`}>
                                    {selectedBadge.tier}
                                </span>

                                <button
                                    onClick={() => setSelectedBadge(null)}
                                    className="w-full mt-6 py-3 bg-brand-subtle text-brand-forest rounded-xl font-medium border border-brand-border"
                                >
                                    {language === 'ar' ? 'إغلاق' : 'Close'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
