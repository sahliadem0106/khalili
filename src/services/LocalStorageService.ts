/**
 * LocalStorageService - Unified local storage management
 * Handles all app data persistence with versioning and sync tracking
 */

import { Prayer, PrayerStatus, HeartCondition } from '../types';

// =================== TYPES ===================

export interface QadaStats {
    totalMissed: number;
    madeUp: number;
}

export interface QuranProgress {
    lastRead: {
        surah: number;
        ayah: number;
        page: number;
        timestamp: string;
    } | null;
    bookmarks: Array<{
        surah: number;
        ayah: number;
        note: string;
        timestamp: string;
    }>;
}

export interface UserSettings {
    calculationMethod: string;
    asrMethod: 'shafi' | 'hanafi';
    adjustments: { fajr: number; dhuhr: number; asr: number; maghrib: number; isha: number };
    notificationsEnabled: boolean;
    prayerReminders: { fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean };
    reminderTiming: string;
    language: 'en' | 'ar';
    theme: 'light' | 'dark' | 'auto';
}

export interface LocalUserData {
    id?: string;
    email?: string;
    name: string;
    firstName?: string;
    lastName?: string;
    nickname?: string;
    location?: string;
    hijriDate?: string;
    avatar: string;
    streak: number;
    level: number;
    currentHeartState: HeartCondition;
    gender?: 'male' | 'female';
    age?: number;
    bio?: string;
    hobbies?: string[];
    socialLinks?: Array<{ platform: string; handle: string }>;
}

export interface LocalData {
    version: number;
    prayers: Prayer[];
    prayerDate: string; // Track the date of the logs
    qadaStats: QadaStats;
    quranProgress: QuranProgress;
    user: LocalUserData;
    settings: Partial<UserSettings>;
    lastModified: string;
    lastSyncedAt: string | null;
    pendingSync: boolean;
}

// =================== CONSTANTS ===================

const STORAGE_KEY = 'khalil_app_data';
const CURRENT_VERSION = 1;

const DEFAULT_DATA: LocalData = {
    version: CURRENT_VERSION,
    prayers: [],
    prayerDate: new Date().toDateString(),
    qadaStats: { totalMissed: 0, madeUp: 0 },
    quranProgress: { lastRead: null, bookmarks: [] },
    user: {
        name: 'Guest',
        avatar: '',
        streak: 0,
        level: 1,
        currentHeartState: 'mindful' as HeartCondition,
    },
    settings: {},
    lastModified: new Date().toISOString(),
    lastSyncedAt: null,
    pendingSync: false,
};

// =================== SERVICE CLASS ===================

class LocalStorageService {
    private data: LocalData;
    private listeners: Set<(data: LocalData) => void> = new Set();

    constructor() {
        this.data = this.loadFromStorage();
        // Migrate legacy data on first load
        this.migrateLegacyData();
    }

    /**
     * Load data from localStorage
     */
    private loadFromStorage(): LocalData {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Version migration if needed
                if (parsed.version < CURRENT_VERSION) {
                    return this.migrateVersion(parsed);
                }

                // CHECK FOR DAILY RESET
                const today = new Date().toDateString();
                const storedDate = parsed.prayerDate || new Date().toDateString(); // Default to today if missing

                if (storedDate !== today) {
                    console.log('New day detected. Resetting prayer logs.');
                    // Reset all prayers to 'upcoming'
                    if (parsed.prayers && Array.isArray(parsed.prayers)) {
                        parsed.prayers = parsed.prayers.map((p: Prayer) => ({
                            ...p,
                            status: PrayerStatus.Upcoming,
                            khushuRating: undefined,
                            journalEntry: undefined,
                            barrier: undefined
                        }));
                    }
                    parsed.prayerDate = today;
                    // We will save this updated state back to storage implicitly via the constructor's flow or explicit save if needed.
                    // However, `loadFromStorage` just returns data. The constructor assigns it to `this.data`.
                    // We should probably save it right away to persist the reset.
                    setTimeout(() => {
                        this.data = { ...DEFAULT_DATA, ...parsed }; // update in-memory
                        this.saveToStorage(); // persist reset
                        this.notifyListeners();
                    }, 0);
                }

                return { ...DEFAULT_DATA, ...parsed };
            }
        } catch (e) {
            console.error('Error loading local data:', e);
        }
        return { ...DEFAULT_DATA };
    }

    /**
     * Migrate from legacy separate localStorage keys
     */
    private migrateLegacyData(): void {
        try {
            // Check for legacy keys
            const legacyPrayers = localStorage.getItem('muslimDaily_prayers');
            const legacyUser = localStorage.getItem('khalil_user');
            const legacyQada = localStorage.getItem('khalil_qada');
            const legacyQuran = localStorage.getItem('khalil_quran_progress');

            let migrated = false;

            if (legacyPrayers && this.data.prayers.length === 0) {
                this.data.prayers = JSON.parse(legacyPrayers);
                migrated = true;
            }

            if (legacyUser) {
                const userData = JSON.parse(legacyUser);
                this.data.user = { ...this.data.user, ...userData };
                migrated = true;
            }

            if (legacyQada) {
                this.data.qadaStats = JSON.parse(legacyQada);
                migrated = true;
            }

            if (legacyQuran) {
                this.data.quranProgress = JSON.parse(legacyQuran);
                migrated = true;
            }

            if (migrated) {
                this.data.lastModified = new Date().toISOString();
                this.data.pendingSync = true;
                this.saveToStorage();
                console.log('Migrated legacy data to unified storage');
            }
        } catch (e) {
            console.error('Error migrating legacy data:', e);
        }
    }

    /**
     * Migrate data between versions
     */
    private migrateVersion(data: any): LocalData {
        // Add version migrations here as needed
        return { ...DEFAULT_DATA, ...data, version: CURRENT_VERSION };
    }

    /**
     * Save data to localStorage
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            this.notifyListeners();
        } catch (e) {
            console.error('Error saving local data:', e);
        }
    }

    /**
     * Get all local data
     */
    getData(): LocalData {
        return { ...this.data };
    }

    /**
     * Update prayers
     */
    setPrayers(prayers: Prayer[]): void {
        this.data.prayers = prayers;
        this.data.prayerDate = new Date().toDateString(); // Ensure date tracks with updates
        this.data.lastModified = new Date().toISOString();
        this.data.pendingSync = true;
        this.saveToStorage();
    }

    /**
     * Get prayers
     */
    getPrayers(): Prayer[] {
        return [...this.data.prayers];
    }

    /**
     * Update Qada stats
     */
    setQadaStats(stats: QadaStats): void {
        this.data.qadaStats = stats;
        this.data.lastModified = new Date().toISOString();
        this.data.pendingSync = true;
        this.saveToStorage();
    }

    /**
     * Get Qada stats
     */
    getQadaStats(): QadaStats {
        return { ...this.data.qadaStats };
    }

    /**
     * Update Quran progress
     */
    setQuranProgress(progress: QuranProgress): void {
        this.data.quranProgress = progress;
        this.data.lastModified = new Date().toISOString();
        this.data.pendingSync = true;
        this.saveToStorage();
    }

    /**
     * Get Quran progress
     */
    getQuranProgress(): QuranProgress {
        return { ...this.data.quranProgress };
    }

    /**
     * Update user data
     */
    setUser(user: Partial<LocalUserData>): void {
        this.data.user = { ...this.data.user, ...user };
        this.data.lastModified = new Date().toISOString();
        this.data.pendingSync = true;
        this.saveToStorage();
    }

    /**
     * Get user data
     */
    getUser(): LocalUserData {
        return { ...this.data.user };
    }

    /**
     * Update settings
     */
    setSettings(settings: Partial<UserSettings>): void {
        this.data.settings = { ...this.data.settings, ...settings };
        this.data.lastModified = new Date().toISOString();
        this.data.pendingSync = true;
        this.saveToStorage();
    }

    /**
     * Get settings
     */
    getSettings(): Partial<UserSettings> {
        return { ...this.data.settings };
    }

    /**
     * Mark data as synced
     */
    markSynced(): void {
        this.data.lastSyncedAt = new Date().toISOString();
        this.data.pendingSync = false;
        this.saveToStorage();
    }

    /**
     * Check if there are pending changes to sync
     */
    hasPendingSync(): boolean {
        return this.data.pendingSync;
    }

    /**
     * Get last sync time
     */
    getLastSyncTime(): Date | null {
        return this.data.lastSyncedAt ? new Date(this.data.lastSyncedAt) : null;
    }

    /**
     * Get last modified time
     */
    getLastModifiedTime(): Date {
        return new Date(this.data.lastModified);
    }

    /**
     * Merge cloud data with local data (newest wins)
     */
    mergeWithCloudData(cloudData: Partial<LocalData>): void {
        const cloudModified = cloudData.lastModified ? new Date(cloudData.lastModified) : new Date(0);
        const localModified = this.getLastModifiedTime();

        // For each data type, keep the newest
        if (cloudData.prayers && cloudModified > localModified) {
            this.data.prayers = cloudData.prayers;
        }

        if (cloudData.qadaStats && cloudModified > localModified) {
            this.data.qadaStats = cloudData.qadaStats;
        }

        if (cloudData.quranProgress) {
            // Merge bookmarks (keep all unique)
            const localBookmarks = this.data.quranProgress.bookmarks || [];
            const cloudBookmarks = cloudData.quranProgress.bookmarks || [];
            const mergedBookmarks = [...localBookmarks];

            for (const cloudMark of cloudBookmarks) {
                const exists = mergedBookmarks.some(
                    b => b.surah === cloudMark.surah && b.ayah === cloudMark.ayah
                );
                if (!exists) {
                    mergedBookmarks.push(cloudMark);
                }
            }

            this.data.quranProgress.bookmarks = mergedBookmarks;

            // Last read: keep newest
            if (cloudData.quranProgress.lastRead) {
                const cloudLastRead = new Date(cloudData.quranProgress.lastRead.timestamp);
                const localLastRead = this.data.quranProgress.lastRead
                    ? new Date(this.data.quranProgress.lastRead.timestamp)
                    : new Date(0);

                if (cloudLastRead > localLastRead) {
                    this.data.quranProgress.lastRead = cloudData.quranProgress.lastRead;
                }
            }
        }

        // Settings: cloud wins
        if (cloudData.settings) {
            this.data.settings = { ...this.data.settings, ...cloudData.settings };
        }

        // User: cloud wins for name/avatar
        if (cloudData.user) {
            this.data.user = {
                ...this.data.user,
                name: cloudData.user.name || this.data.user.name,
                avatar: cloudData.user.avatar || this.data.user.avatar,
            };
        }

        this.data.lastModified = new Date().toISOString();
        this.saveToStorage();
    }

    /**
     * Clear all local data (after migration or logout)
     */
    clearData(): void {
        this.data = { ...DEFAULT_DATA };
        this.saveToStorage();

        // Also clear legacy keys
        localStorage.removeItem('muslimDaily_prayers');
        localStorage.removeItem('khalil_user');
        localStorage.removeItem('khalil_qada');
        localStorage.removeItem('khalil_quran_progress');
    }

    /**
     * Subscribe to data changes
     */
    subscribe(listener: (data: LocalData) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.getData()));
    }

    /**
     * Export data for cloud sync
     */
    exportForSync(): Omit<LocalData, 'version' | 'lastSyncedAt' | 'pendingSync'> {
        const { version, lastSyncedAt, pendingSync, ...exportData } = this.data;
        return exportData;
    }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();
