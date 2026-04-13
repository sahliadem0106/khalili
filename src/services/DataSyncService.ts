/**
 * DataSyncService - Cloud sync for prayer logs and user data
 */

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Prayer, PrayerStatus } from '../types';

// =================== TYPES ===================

export interface PrayerLog {
    id: string;
    date: string; // YYYY-MM-DD format
    prayerName: string; // fajr, dhuhr, asr, maghrib, isha
    status: PrayerStatus;
    scheduledTime: string;
    completedTime: string | null;
    khushuLevel: number | null; // 1-5
    barrier: string | null;
    journal: string | null;
    location: 'mosque' | 'home' | 'work' | 'other' | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface DailyPrayerSummary {
    date: string;
    prayers: {
        fajr: PrayerLog | null;
        dhuhr: PrayerLog | null;
        asr: PrayerLog | null;
        maghrib: PrayerLog | null;
        isha: PrayerLog | null;
    };
    completedCount: number;
    onTimeCount: number;
}

export interface SyncStatus {
    lastSyncTime: Date | null;
    isSyncing: boolean;
    pendingChanges: number;
    error: string | null;
}

// =================== CONSTANTS ===================

const PRAYER_LOGS_COLLECTION = 'prayerLogs';
const QURAN_PROGRESS_COLLECTION = 'quranProgress';
const BOOKMARKS_COLLECTION = 'bookmarks';

// =================== SERVICE CLASS ===================

class DataSyncService {
    private userId: string | null = null;
    private syncStatus: SyncStatus = {
        lastSyncTime: null,
        isSyncing: false,
        pendingChanges: 0,
        error: null,
    };
    private listeners: Set<(status: SyncStatus) => void> = new Set();

    /**
     * Set the current user ID for sync operations
     */
    setUserId(userId: string | null): void {
        this.userId = userId;
    }

    /**
     * Get user's prayer logs collection reference
     */
    private getPrayerLogsRef() {
        if (!this.userId) throw new Error('User not authenticated');
        return collection(db, 'users', this.userId, PRAYER_LOGS_COLLECTION);
    }

    /**
     * Log a prayer
     */
    async logPrayer(prayer: Omit<PrayerLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrayerLog> {
        if (!this.userId) throw new Error('User not authenticated');

        const id = `${prayer.date}_${prayer.prayerName}`;
        const docRef = doc(this.getPrayerLogsRef(), id);

        const prayerLog: PrayerLog = {
            ...prayer,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await setDoc(docRef, {
            ...prayerLog,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        this.updateSyncStatus({ lastSyncTime: new Date() });
        return prayerLog;
    }

    /**
     * Update a prayer log
     */
    async updatePrayerLog(id: string, updates: Partial<PrayerLog>): Promise<void> {
        if (!this.userId) throw new Error('User not authenticated');

        const docRef = doc(this.getPrayerLogsRef(), id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });

        this.updateSyncStatus({ lastSyncTime: new Date() });
    }

    /**
     * Get prayer logs for a specific date
     */
    async getPrayerLogsForDate(date: string): Promise<PrayerLog[]> {
        if (!this.userId) throw new Error('User not authenticated');

        const q = query(
            this.getPrayerLogsRef(),
            where('date', '==', date)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => this.docToPrayerLog(doc));
    }

    /**
     * Get prayer logs for a date range
     */
    async getPrayerLogsForRange(startDate: string, endDate: string): Promise<PrayerLog[]> {
        if (!this.userId) throw new Error('User not authenticated');

        const q = query(
            this.getPrayerLogsRef(),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => this.docToPrayerLog(doc));
    }

    /**
     * Get recent prayer logs
     */
    async getRecentPrayerLogs(count: number = 30): Promise<PrayerLog[]> {
        if (!this.userId) throw new Error('User not authenticated');

        const q = query(
            this.getPrayerLogsRef(),
            orderBy('date', 'desc'),
            limit(count * 5) // 5 prayers per day
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => this.docToPrayerLog(doc));
    }

    /**
     * Calculate prayer statistics
     */
    async calculateStats(): Promise<{
        totalPrayers: number;
        onTimeRate: number;
        currentStreak: number;
        longestStreak: number;
    }> {
        const logs = await this.getRecentPrayerLogs(90);

        const totalPrayers = logs.filter(l =>
            l.status === 'jamaah' || l.status === 'home' || l.status === 'late'
        ).length;

        const onTimePrayers = logs.filter(l =>
            l.status === 'jamaah' || l.status === 'home'
        ).length;

        const onTimeRate = totalPrayers > 0 ? (onTimePrayers / totalPrayers) * 100 : 0;

        // Calculate streaks (simplified)
        const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (const date of dates) {
            const dayLogs = logs.filter(l => l.date === date);
            const completedCount = dayLogs.filter(l =>
                l.status === 'jamaah' || l.status === 'home' || l.status === 'late'
            ).length;

            if (completedCount >= 5) {
                tempStreak++;
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else {
                if (currentStreak === 0) currentStreak = tempStreak;
                tempStreak = 0;
            }
        }

        if (currentStreak === 0) currentStreak = tempStreak;

        return { totalPrayers, onTimeRate, currentStreak, longestStreak };
    }

    /**
     * Sync local data to cloud
     */
    async syncToCloud(localPrayers: Prayer[]): Promise<void> {
        if (!this.userId) throw new Error('User not authenticated');

        this.updateSyncStatus({ isSyncing: true, error: null });

        try {
            const today = new Date().toISOString().split('T')[0];
            const batch = writeBatch(db);

            for (const prayer of localPrayers) {
                const id = `${today}_${prayer.name.toLowerCase()}`;
                const docRef = doc(this.getPrayerLogsRef(), id);

                batch.set(docRef, {
                    id,
                    date: today,
                    prayerName: prayer.name.toLowerCase(),
                    status: prayer.status,
                    scheduledTime: prayer.time,
                    completedTime: prayer.status !== 'pending' ? new Date().toISOString() : null,
                    khushuLevel: prayer.khushu || null,
                    barrier: prayer.barrier || null,
                    journal: prayer.reflection || null,
                    location: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            }

            await batch.commit();
            this.updateSyncStatus({
                isSyncing: false,
                lastSyncTime: new Date(),
                pendingChanges: 0
            });
        } catch (error: any) {
            this.updateSyncStatus({
                isSyncing: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Convert Firestore document to PrayerLog
     */
    private docToPrayerLog(doc: any): PrayerLog {
        const data = doc.data();
        return {
            id: doc.id,
            date: data.date,
            prayerName: data.prayerName,
            status: data.status,
            scheduledTime: data.scheduledTime,
            completedTime: data.completedTime,
            khushuLevel: data.khushuLevel,
            barrier: data.barrier,
            journal: data.journal,
            location: data.location,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
        };
    }

    /**
     * Get current sync status
     */
    getSyncStatus(): SyncStatus {
        return { ...this.syncStatus };
    }

    /**
     * Subscribe to sync status changes
     */
    subscribe(listener: (status: SyncStatus) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Update sync status and notify listeners
     */
    private updateSyncStatus(updates: Partial<SyncStatus>): void {
        this.syncStatus = { ...this.syncStatus, ...updates };
        this.listeners.forEach(listener => listener(this.syncStatus));
    }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();
