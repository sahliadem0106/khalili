/**
 * PrayerLogService - Manages prayer history with real data
 * All metrics (streak, heart state) are computed from this data
 */

import { PrayerStatus } from '../types';

// =================== TYPES ===================

export interface PrayerLogEntry {
    date: string;               // 'YYYY-MM-DD'
    prayerId: string;           // 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
    status: PrayerStatus;
    khushuLevel: number;        // 0 = not rated, 1-5 = rating
    barrier: string | null;     // 'sleep' | 'work' | 'travel' | null
    completedAt: string;        // ISO timestamp
}

export interface DailyPrayerSummary {
    date: string;
    completed: number;          // 0-5
    missed: number;             // 0-5
    onTime: number;             // jamaah + home count
    late: number;
    avgKhushu: number;          // 0-5 or 0 if none rated
    prayers: Record<string, PrayerLogEntry | null>;
}

// =================== CONSTANTS ===================

const STORAGE_KEY_PREFIX = 'khalil_prayer_logs';
const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// =================== HELPER ===================

function getDateStr(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
}

function parseDate(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00');
}

// =================== SERVICE CLASS ===================

class PrayerLogService {
    private logs: PrayerLogEntry[] = [];
    private listeners: Set<() => void> = new Set();
    private currentUserId: string | null = null;

    constructor() {
        // Try to load user from auth storage
        this.initializeUser();
    }

    /**
     * Initialize user from stored auth data
     */
    private initializeUser(): void {
        try {
            const authData = localStorage.getItem('auth_user');
            if (authData) {
                const user = JSON.parse(authData);
                if (user?.uid) {
                    this.currentUserId = user.uid;
                    this.loadFromStorage();
                }
            }
        } catch (e) {
            console.error('Error initializing user:', e);
        }
    }

    /**
     * Set current user and load their logs
     */
    setCurrentUser(userId: string | null): void {
        if (this.currentUserId === userId) return;

        this.currentUserId = userId;
        this.logs = [];

        if (userId) {
            this.loadFromStorage();
        }

        this.notifyListeners();
    }

    /**
     * Get current storage key (user-specific)
     */
    private getCurrentStorageKey(): string | null {
        if (!this.currentUserId) {
            console.log('[PrayerLogService] No user ID - not loading any logs');
            return null; // Don't use fallback - each user should have their own data
        }
        return `${STORAGE_KEY_PREFIX}_${this.currentUserId}`;
    }

    /**
     * Load logs from localStorage
     */
    private loadFromStorage(): void {
        const key = this.getCurrentStorageKey();
        if (!key) {
            this.logs = [];
            return;
        }

        try {
            console.log('[PrayerLogService] Loading logs for key:', key);
            const stored = localStorage.getItem(key);
            if (stored) {
                this.logs = JSON.parse(stored);
                console.log('[PrayerLogService] Loaded', this.logs.length, 'logs');
            } else {
                this.logs = [];
                console.log('[PrayerLogService] No logs found for this user');
            }
        } catch (e) {
            console.error('Error loading prayer logs:', e);
            this.logs = [];
        }
    }

    /**
     * Save logs to localStorage
     */
    private saveToStorage(): void {
        const key = this.getCurrentStorageKey();
        if (!key) {
            console.warn('[PrayerLogService] Cannot save - no user ID');
            return;
        }

        try {
            console.log('[PrayerLogService] Saving', this.logs.length, 'logs to key:', key);
            localStorage.setItem(key, JSON.stringify(this.logs));
            this.notifyListeners();
        } catch (e) {
            console.error('Error saving prayer logs:', e);
        }
    }

    /**
     * Log a prayer
     */
    logPrayer(
        prayerId: string,
        status: PrayerStatus,
        khushuLevel: number = 0,
        barrier: string | null = null,
        date: string = getDateStr()
    ): void {
        // Remove existing log for this prayer on this date
        this.logs = this.logs.filter(
            log => !(log.date === date && log.prayerId === prayerId)
        );

        // Add new log
        this.logs.push({
            date,
            prayerId,
            status,
            khushuLevel,
            barrier,
            completedAt: new Date().toISOString(),
        });

        this.saveToStorage();

        // Update gamification stats
        import('./BadgeService').then(({ BadgeService }) => {
            BadgeService.updateStat('prayers_completed', 1);
            BadgeService.updateStat('prayer_streak', this.calculateStreak());
        }).catch(err => console.error('Failed to update badges', err));

        // Sync stats to partnership (async, don't block)
        this.syncToPartnership();
    }

    /**
     * Sync prayer stats to active partnership in Firestore
     */
    private async syncToPartnership(): Promise<void> {
        try {
            // Dynamic imports to avoid circular dependencies
            const { PartnerService } = await import('./PartnerService');

            // Get current user ID from localStorage or auth
            const authData = localStorage.getItem('auth_user');
            if (!authData) return;

            const user = JSON.parse(authData);
            if (!user?.uid) return;

            // Check if user has an active partnership
            const partnership = await PartnerService.getActivePartnership(user.uid);
            if (!partnership) return;

            // Calculate stats
            const totalPrayers = this.getTotalPrayers();
            const streak = this.calculateStreak();
            const todayLogs = this.getLogsForDate(getDateStr());
            const lastPrayed = todayLogs.length > 0
                ? todayLogs[todayLogs.length - 1].prayerId
                : '';

            // Update partnership stats
            await PartnerService.updateMyStats(partnership.id, user.uid, {
                totalPrayersLogged: totalPrayers,
                currentStreak: streak,
                lastPrayed
            });
        } catch (error) {
            console.error('Failed to sync prayer stats to partnership:', error);
        }
    }

    /**
     * Get all logs
     */
    getLogs(): PrayerLogEntry[] {
        return [...this.logs];
    }

    /**
     * Merge cloud logs into local storage without duplicates.
     * Keeps the most recent completedAt entry per date+prayer.
     */
    importLogs(entries: PrayerLogEntry[]): void {
        if (!entries.length) return;

        const merged = new Map<string, PrayerLogEntry>();

        [...this.logs, ...entries].forEach((entry) => {
            const key = `${entry.date}_${entry.prayerId}`;
            const existing = merged.get(key);

            if (!existing) {
                merged.set(key, entry);
                return;
            }

            const existingTime = new Date(existing.completedAt).getTime();
            const incomingTime = new Date(entry.completedAt).getTime();
            if (incomingTime >= existingTime) {
                merged.set(key, entry);
            }
        });

        this.logs = Array.from(merged.values()).sort((a, b) => {
            if (a.date === b.date) return a.prayerId.localeCompare(b.prayerId);
            return a.date.localeCompare(b.date);
        });

        this.saveToStorage();
    }

    /**
     * Get logs for a specific date
     */
    getLogsForDate(date: string): PrayerLogEntry[] {
        return this.logs.filter(log => log.date === date);
    }

    /**
     * Get logs for date range
     */
    getLogsForRange(startDate: string, endDate: string): PrayerLogEntry[] {
        return this.logs.filter(log => log.date >= startDate && log.date <= endDate);
    }

    /**
     * Get logs for last N days
     */
    getLogsForDays(days: number): PrayerLogEntry[] {
        const endDate = getDateStr();
        const startDate = getDateStr(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
        return this.getLogsForRange(startDate, endDate);
    }

    /**
     * Get daily summary for a date
     */
    getDailySummary(date: string): DailyPrayerSummary {
        const dayLogs = this.getLogsForDate(date);
        const prayers: Record<string, PrayerLogEntry | null> = {};

        PRAYER_IDS.forEach(id => {
            prayers[id] = dayLogs.find(l => l.prayerId === id) || null;
        });

        const completed = dayLogs.filter(l => l.status !== PrayerStatus.Missed && l.status !== PrayerStatus.Upcoming).length;
        const missed = dayLogs.filter(l => l.status === PrayerStatus.Missed).length;
        const onTime = dayLogs.filter(l => l.status === PrayerStatus.Jamaah || l.status === PrayerStatus.Home).length;
        const late = dayLogs.filter(l => l.status === PrayerStatus.Late).length;

        const ratedLogs = dayLogs.filter(l => l.khushuLevel > 0);
        const avgKhushu = ratedLogs.length > 0
            ? ratedLogs.reduce((sum, l) => sum + l.khushuLevel, 0) / ratedLogs.length
            : 0;

        return { date, completed, missed, onTime, late, avgKhushu, prayers };
    }

    /**
     * Get summaries for last N days
     */
    getDailySummaries(days: number): DailyPrayerSummary[] {
        const summaries: DailyPrayerSummary[] = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            summaries.push(this.getDailySummary(getDateStr(date)));
        }

        return summaries;
    }

    /**
     * Calculate current streak (consecutive days with all 5 prayers not missed)
     */
    calculateStreak(): number {
        let streak = 0;
        const today = new Date();
        let currentDate = new Date(today);

        // Group logs by date
        const logsByDate: Record<string, PrayerLogEntry[]> = {};
        this.logs.forEach(log => {
            if (!logsByDate[log.date]) logsByDate[log.date] = [];
            logsByDate[log.date].push(log);
        });

        while (true) {
            const dateStr = getDateStr(currentDate);
            const dayLogs = logsByDate[dateStr] || [];

            // Check if all 5 prayers were logged and none missed
            const completedPrayers = PRAYER_IDS.filter(id =>
                dayLogs.some(log => log.prayerId === id && log.status !== PrayerStatus.Missed)
            );

            if (completedPrayers.length === 5) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                // If today has incomplete prayers, check if any are still upcoming
                if (dateStr === getDateStr(today)) {
                    // For today, only break if there's an actual missed prayer
                    const hasMissed = dayLogs.some(log => log.status === PrayerStatus.Missed);
                    if (hasMissed) break;
                    // Continue checking previous days
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }

            // Safety: don't go back more than a year
            if (streak > 365) break;
        }

        return streak;
    }

    /**
     * Get total prayers logged
     */
    getTotalPrayers(): number {
        return this.logs.filter(l =>
            l.status !== PrayerStatus.Missed && l.status !== PrayerStatus.Upcoming
        ).length;
    }

    /**
     * Subscribe to changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Clear all logs (for testing)
     */
    clearLogs(): void {
        this.logs = [];
        this.saveToStorage();
    }
}

// Export singleton
export const prayerLogService = new PrayerLogService();
