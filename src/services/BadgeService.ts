/**
 * BadgeService - Gamification badges for prayer, study, and tasbih achievements
 */

// Badge Categories
export type BadgeCategory = 'prayer' | 'study' | 'tasbih' | 'social' | 'streak';

// Badge Tier (rarity)
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// Badge Definition
export interface BadgeDefinition {
    id: string;
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    category: BadgeCategory;
    tier: BadgeTier;
    icon: string; // Emoji or icon name
    requirement: {
        type: 'count' | 'streak' | 'special';
        target: number;
        metric: string; // e.g., 'prayers_completed', 'study_minutes', 'tasbih_count'
    };
}

// User's earned badge
export interface UserBadge {
    badgeId: string;
    earnedAt: string;
    progress: number; // Current progress towards target
    isNew: boolean; // For "new badge" animation
}

// Badge progress data stored in localStorage
export interface BadgeProgress {
    userId: string;
    badges: UserBadge[];
    stats: {
        totalPrayers: number;
        prayerStreak: number;
        totalStudyMinutes: number;
        studyStreak: number;
        totalTasbih: number;
        partnersConnected: number;
        circlesJoined: number;
    };
    lastUpdated: string;
}

// =================== BADGE DEFINITIONS ===================

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    // PRAYER BADGES
    {
        id: 'prayer_novice',
        name: 'Prayer Novice',
        nameAr: 'مبتدئ الصلاة',
        description: 'Complete 5 prayers',
        descriptionAr: 'أكمل 5 صلوات',
        category: 'prayer',
        tier: 'bronze',
        icon: '🕌',
        requirement: { type: 'count', target: 5, metric: 'prayers_completed' }
    },
    {
        id: 'prayer_devoted',
        name: 'Devoted Worshipper',
        nameAr: 'عابد مخلص',
        description: 'Complete 100 prayers',
        descriptionAr: 'أكمل 100 صلاة',
        category: 'prayer',
        tier: 'silver',
        icon: '✨',
        requirement: { type: 'count', target: 100, metric: 'prayers_completed' }
    },
    {
        id: 'prayer_master',
        name: 'Prayer Master',
        nameAr: 'سيد الصلاة',
        description: 'Complete 500 prayers',
        descriptionAr: 'أكمل 500 صلاة',
        category: 'prayer',
        tier: 'gold',
        icon: '🌟',
        requirement: { type: 'count', target: 500, metric: 'prayers_completed' }
    },
    {
        id: 'prayer_streak_7',
        name: 'Weekly Warrior',
        nameAr: 'محارب أسبوعي',
        description: '7-day prayer streak',
        descriptionAr: 'سلسلة صلاة لـ7 أيام',
        category: 'prayer',
        tier: 'bronze',
        icon: '🔥',
        requirement: { type: 'streak', target: 7, metric: 'prayer_streak' }
    },
    {
        id: 'prayer_streak_30',
        name: 'Monthly Master',
        nameAr: 'سيد الشهر',
        description: '30-day prayer streak',
        descriptionAr: 'سلسلة صلاة لـ30 يوم',
        category: 'prayer',
        tier: 'gold',
        icon: '💎',
        requirement: { type: 'streak', target: 30, metric: 'prayer_streak' }
    },

    // STUDY BADGES
    {
        id: 'study_beginner',
        name: 'Knowledge Seeker',
        nameAr: 'طالب العلم',
        description: 'Study for 60 minutes',
        descriptionAr: 'ادرس لمدة 60 دقيقة',
        category: 'study',
        tier: 'bronze',
        icon: '📚',
        requirement: { type: 'count', target: 60, metric: 'study_minutes' }
    },
    {
        id: 'study_dedicated',
        name: 'Dedicated Learner',
        nameAr: 'متعلم متفانٍ',
        description: 'Study for 600 minutes (10 hours)',
        descriptionAr: 'ادرس لمدة 10 ساعات',
        category: 'study',
        tier: 'silver',
        icon: '🎓',
        requirement: { type: 'count', target: 600, metric: 'study_minutes' }
    },
    {
        id: 'study_scholar',
        name: 'Scholar',
        nameAr: 'عالم',
        description: 'Study for 3000 minutes (50 hours)',
        descriptionAr: 'ادرس لمدة 50 ساعة',
        category: 'study',
        tier: 'gold',
        icon: '🏆',
        requirement: { type: 'count', target: 3000, metric: 'study_minutes' }
    },

    // TASBIH BADGES
    {
        id: 'tasbih_starter',
        name: 'Remembrance Starter',
        nameAr: 'بداية الذكر',
        description: 'Count 100 tasbih',
        descriptionAr: 'عد 100 تسبيحة',
        category: 'tasbih',
        tier: 'bronze',
        icon: '📿',
        requirement: { type: 'count', target: 100, metric: 'tasbih_count' }
    },
    {
        id: 'tasbih_devoted',
        name: 'Devoted Rememberer',
        nameAr: 'ذاكر مخلص',
        description: 'Count 1000 tasbih',
        descriptionAr: 'عد 1000 تسبيحة',
        category: 'tasbih',
        tier: 'silver',
        icon: '🌙',
        requirement: { type: 'count', target: 1000, metric: 'tasbih_count' }
    },
    {
        id: 'tasbih_master',
        name: 'Dhikr Master',
        nameAr: 'سيد الذكر',
        description: 'Count 10000 tasbih',
        descriptionAr: 'عد 10000 تسبيحة',
        category: 'tasbih',
        tier: 'gold',
        icon: '⭐',
        requirement: { type: 'count', target: 10000, metric: 'tasbih_count' }
    },

    // SOCIAL BADGES
    {
        id: 'social_first_partner',
        name: 'First Partner',
        nameAr: 'الشريك الأول',
        description: 'Connect with your first partner',
        descriptionAr: 'تواصل مع شريكك الأول',
        category: 'social',
        tier: 'bronze',
        icon: '🤝',
        requirement: { type: 'count', target: 1, metric: 'partners_connected' }
    },
    {
        id: 'social_circle_joiner',
        name: 'Circle Joiner',
        nameAr: 'عضو الدائرة',
        description: 'Join a Suhba Circle',
        descriptionAr: 'انضم إلى دائرة صحبة',
        category: 'social',
        tier: 'bronze',
        icon: '👥',
        requirement: { type: 'count', target: 1, metric: 'circles_joined' }
    },
];

// =================== BADGE SERVICE ===================

const BADGE_STORAGE_KEY = 'khalil_badge_progress';

export const BadgeService = {
    // Get current badge progress
    getProgress(): BadgeProgress | null {
        const stored = localStorage.getItem(BADGE_STORAGE_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    },

    // Initialize badge progress for user
    initProgress(userId: string): BadgeProgress {
        const progress: BadgeProgress = {
            userId,
            badges: [],
            stats: {
                totalPrayers: 0,
                prayerStreak: 0,
                totalStudyMinutes: 0,
                studyStreak: 0,
                totalTasbih: 0,
                partnersConnected: 0,
                circlesJoined: 0,
            },
            lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(progress));
        return progress;
    },

    // Update a stat and check for new badges
    updateStat(metric: string, value: number): UserBadge[] {
        let progress = this.getProgress();
        if (!progress) {
            progress = this.initProgress('anonymous');
        }

        // Update the stat
        switch (metric) {
            case 'prayers_completed':
                progress.stats.totalPrayers += value;
                break;
            case 'prayer_streak':
                progress.stats.prayerStreak = value;
                break;
            case 'study_minutes':
                progress.stats.totalStudyMinutes += value;
                break;
            case 'study_streak':
                progress.stats.studyStreak = value;
                break;
            case 'tasbih_count':
                progress.stats.totalTasbih += value;
                break;
            case 'partners_connected':
                progress.stats.partnersConnected += value;
                break;
            case 'circles_joined':
                progress.stats.circlesJoined += value;
                break;
        }

        progress.lastUpdated = new Date().toISOString();

        // Check for newly earned badges
        const newBadges = this.checkForNewBadges(progress);

        localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(progress));
        return newBadges;
    },

    // Check which badges have been newly earned
    checkForNewBadges(progress: BadgeProgress): UserBadge[] {
        const newBadges: UserBadge[] = [];

        for (const badge of BADGE_DEFINITIONS) {
            // Skip if already earned
            if (progress.badges.some(b => b.badgeId === badge.id)) continue;

            // Get current value for the metric
            let currentValue = 0;
            switch (badge.requirement.metric) {
                case 'prayers_completed':
                    currentValue = progress.stats.totalPrayers;
                    break;
                case 'prayer_streak':
                    currentValue = progress.stats.prayerStreak;
                    break;
                case 'study_minutes':
                    currentValue = progress.stats.totalStudyMinutes;
                    break;
                case 'study_streak':
                    currentValue = progress.stats.studyStreak;
                    break;
                case 'tasbih_count':
                    currentValue = progress.stats.totalTasbih;
                    break;
                case 'partners_connected':
                    currentValue = progress.stats.partnersConnected;
                    break;
                case 'circles_joined':
                    currentValue = progress.stats.circlesJoined;
                    break;
            }

            // Check if target is met
            if (currentValue >= badge.requirement.target) {
                const userBadge: UserBadge = {
                    badgeId: badge.id,
                    earnedAt: new Date().toISOString(),
                    progress: currentValue,
                    isNew: true,
                };
                progress.badges.push(userBadge);
                newBadges.push(userBadge);
            }
        }

        return newBadges;
    },

    // Get all earned badges
    getEarnedBadges(): (BadgeDefinition & { earnedAt: string })[] {
        const progress = this.getProgress();
        if (!progress) return [];

        return progress.badges
            .map(ub => {
                const def = BADGE_DEFINITIONS.find(b => b.id === ub.badgeId);
                if (!def) return null;
                return { ...def, earnedAt: ub.earnedAt };
            })
            .filter((b): b is BadgeDefinition & { earnedAt: string } => b !== null);
    },

    // Get badge progress for a specific badge
    getBadgeProgress(badgeId: string): { current: number; target: number; percentage: number } | null {
        const progress = this.getProgress();
        const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
        if (!progress || !badge) return null;

        let currentValue = 0;
        switch (badge.requirement.metric) {
            case 'prayers_completed':
                currentValue = progress.stats.totalPrayers;
                break;
            case 'prayer_streak':
                currentValue = progress.stats.prayerStreak;
                break;
            case 'study_minutes':
                currentValue = progress.stats.totalStudyMinutes;
                break;
            case 'tasbih_count':
                currentValue = progress.stats.totalTasbih;
                break;
            case 'partners_connected':
                currentValue = progress.stats.partnersConnected;
                break;
            case 'circles_joined':
                currentValue = progress.stats.circlesJoined;
                break;
        }

        return {
            current: currentValue,
            target: badge.requirement.target,
            percentage: Math.min(100, (currentValue / badge.requirement.target) * 100),
        };
    },

    // Mark badge as seen (no longer new)
    markBadgeSeen(badgeId: string): void {
        const progress = this.getProgress();
        if (!progress) return;

        const badge = progress.badges.find(b => b.badgeId === badgeId);
        if (badge) {
            badge.isNew = false;
            localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(progress));
        }
    },

    // Get badges by category
    getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
        return BADGE_DEFINITIONS.filter(b => b.category === category);
    },

    // Get tier color
    getTierColor(tier: BadgeTier): string {
        switch (tier) {
            case 'bronze': return '#CD7F32';
            case 'silver': return '#C0C0C0';
            case 'gold': return '#FFD700';
            case 'platinum': return '#E5E4E2';
            default: return '#6B7280';
        }
    },
};
