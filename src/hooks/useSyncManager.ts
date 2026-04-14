/**
 * useSyncManager - Hook for managing data sync between local and cloud
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { localStorageService, LocalData } from '../services/LocalStorageService';
import { dataSyncService } from '../services/DataSyncService';
import { prayerLogService } from '../services/PrayerLogService';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

// =================== TYPES ===================

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'migrating';

export interface SyncState {
    status: SyncStatus;
    lastSync: Date | null;
    pendingChanges: boolean;
    error: string | null;
    isOnline: boolean;
}

// =================== HOOK ===================

export function useSyncManager() {
    const { isAuthenticated, user } = useAuth();
    const [syncState, setSyncState] = useState<SyncState>({
        status: 'idle',
        lastSync: localStorageService.getLastSyncTime(),
        pendingChanges: localStorageService.hasPendingSync(),
        error: null,
        isOnline: navigator.onLine,
    });

    const syncInProgress = useRef(false);
    const migrationDone = useRef(false);

    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setSyncState(prev => ({ ...prev, isOnline: true }));
            // Trigger sync when coming back online
            if (isAuthenticated && localStorageService.hasPendingSync()) {
                syncToCloud();
            }
        };

        const handleOffline = () => {
            setSyncState(prev => ({ ...prev, isOnline: false, status: 'offline' }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isAuthenticated]);

    // Handle first-time login migration
    useEffect(() => {
        if (isAuthenticated && user && !migrationDone.current) {
            migrateGuestData();
        }
    }, [isAuthenticated, user]);

    // Subscribe to local data changes
    useEffect(() => {
        const unsubscribe = localStorageService.subscribe(() => {
            setSyncState(prev => ({
                ...prev,
                pendingChanges: localStorageService.hasPendingSync(),
            }));
        });

        return unsubscribe;
    }, []);

    /**
     * Migrate guest data to cloud on first login
     */
    const migrateGuestData = useCallback(async () => {
        // CRITICAL: Don't migrate during active onboarding - wait until profile is complete
        const { onboardingService } = await import('../services/OnboardingService');
        if (!onboardingService.isOnboardingComplete()) {
            console.log('[SyncManager] Skipping migration - onboarding not complete');
            return;
        }

        if (!user || migrationDone.current || syncInProgress.current) return;

        syncInProgress.current = true;
        setSyncState(prev => ({ ...prev, status: 'migrating', error: null }));

        try {
            const localData = localStorageService.exportForSync();

            // Check if user has existing cloud data
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // User has cloud data - merge with local
                const cloudData = userDoc.data() as Partial<LocalData>;
                localStorageService.mergeWithCloudData(cloudData);
                console.log('Merged cloud data with local data');

                // Always import full historical prayer logs from cloud on migration.
                dataSyncService.setUserId(user.uid);
                const cloudPrayerLogs = await dataSyncService.getAllPrayerLogs();
                prayerLogService.importLogs(
                    cloudPrayerLogs.map((log) => ({
                        date: log.date,
                        prayerId: log.prayerName,
                        status: log.status,
                        khushuLevel: log.khushuLevel || 0,
                        barrier: log.barrier,
                        completedAt: log.completedTime || log.updatedAt.toISOString(),
                    }))
                );
            }

            // Upload current local changes to cloud (if any).
            // Do this inline to avoid being blocked by syncInProgress guard.
            const mergedData = localStorageService.exportForSync();
            const shouldPushLocal = localStorageService.hasPendingSync() || localData.prayers.length > 0;
            if (shouldPushLocal && navigator.onLine) {
                const userDocRefForSync = doc(db, 'users', user.uid);
                await setDoc(userDocRefForSync, {
                    displayName: mergedData.user.name,
                    firstName: mergedData.user.firstName || null,
                    lastName: mergedData.user.lastName || null,
                    nickname: mergedData.user.nickname || null,
                    gender: mergedData.user.gender || null,
                    age: mergedData.user.age || null,
                    bio: mergedData.user.bio || null,
                    hobbies: mergedData.user.hobbies || [],
                    socialLinks: mergedData.user.socialLinks || [],
                    photoURL: mergedData.user.avatar || null,
                    streak: mergedData.user.streak,
                    level: mergedData.user.level,
                    heartState: mergedData.user.currentHeartState,
                    settings: mergedData.settings,
                    qadaStats: mergedData.qadaStats,
                    quranProgress: mergedData.quranProgress,
                    lastModified: mergedData.lastModified,
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                if (mergedData.prayers.length > 0) {
                    dataSyncService.setUserId(user.uid);
                    await dataSyncService.syncToCloud(mergedData.prayers);
                }
            }

            migrationDone.current = true;
            localStorageService.markSynced();
            setSyncState(prev => ({
                ...prev,
                status: 'synced',
                lastSync: new Date(),
            }));

            console.log('Guest data migration complete');
        } catch (error: any) {
            console.error('Migration error:', error);
            setSyncState(prev => ({
                ...prev,
                status: 'error',
                error: error.message || 'Migration failed',
            }));
        } finally {
            syncInProgress.current = false;
        }
    }, [user]);

    /**
     * Sync local data to cloud
     */
    const syncToCloud = useCallback(async () => {
        if (!isAuthenticated || !user || syncInProgress.current || !navigator.onLine) {
            return;
        }

        syncInProgress.current = true;
        setSyncState(prev => ({ ...prev, status: 'syncing', error: null }));

        try {
            const localData = localStorageService.exportForSync();

            // Save user profile data
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                displayName: localData.user.name,
                firstName: localData.user.firstName || null,
                lastName: localData.user.lastName || null,
                nickname: localData.user.nickname || null,
                gender: localData.user.gender || null,
                age: localData.user.age || null,
                bio: localData.user.bio || null,
                hobbies: localData.user.hobbies || [],
                socialLinks: localData.user.socialLinks || [],
                photoURL: localData.user.avatar || null,
                streak: localData.user.streak,
                level: localData.user.level,
                heartState: localData.user.currentHeartState,
                settings: localData.settings,
                qadaStats: localData.qadaStats,
                quranProgress: localData.quranProgress,
                lastModified: localData.lastModified,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            // Sync prayers via DataSyncService
            if (localData.prayers.length > 0) {
                dataSyncService.setUserId(user.uid);
                await dataSyncService.syncToCloud(localData.prayers);
            }

            localStorageService.markSynced();

            setSyncState(prev => ({
                ...prev,
                status: 'synced',
                lastSync: new Date(),
                pendingChanges: false,
            }));

            // Reset status to idle after 3 seconds
            setTimeout(() => {
                setSyncState(prev => {
                    if (prev.status === 'synced') {
                        return { ...prev, status: 'idle' };
                    }
                    return prev;
                });
            }, 3000);

        } catch (error: any) {
            console.error('Sync error:', error);
            setSyncState(prev => ({
                ...prev,
                status: 'error',
                error: error.message || 'Sync failed',
            }));
        } finally {
            syncInProgress.current = false;
        }
    }, [isAuthenticated, user]);

    /**
     * Pull data from cloud
     */
    const syncFromCloud = useCallback(async () => {
        if (!isAuthenticated || !user || syncInProgress.current || !navigator.onLine) {
            return;
        }

        syncInProgress.current = true;
        setSyncState(prev => ({ ...prev, status: 'syncing', error: null }));

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const cloudData = userDoc.data();
                localStorageService.mergeWithCloudData({
                    user: {
                        name: cloudData.displayName || 'User',
                        avatar: cloudData.photoURL || '',
                        streak: cloudData.streak || 0,
                        level: cloudData.level || 1,
                        currentHeartState: cloudData.heartState || 'mindful',
                    },
                    settings: cloudData.settings || {},
                    qadaStats: cloudData.qadaStats || { totalMissed: 0, madeUp: 0 },
                    quranProgress: cloudData.quranProgress || { lastRead: null, bookmarks: [] },
                    lastModified: cloudData.lastModified || new Date().toISOString(),
                } as Partial<LocalData>);
            }

            // Pull complete historical prayer logs from Firestore and merge locally.
            dataSyncService.setUserId(user.uid);
            const cloudPrayerLogs = await dataSyncService.getAllPrayerLogs();
            prayerLogService.importLogs(
                cloudPrayerLogs.map((log) => ({
                    date: log.date,
                    prayerId: log.prayerName,
                    status: log.status,
                    khushuLevel: log.khushuLevel || 0,
                    barrier: log.barrier,
                    completedAt: log.completedTime || log.updatedAt.toISOString(),
                }))
            );

            localStorageService.markSynced();
            setSyncState(prev => ({
                ...prev,
                status: 'synced',
                lastSync: new Date(),
            }));

        } catch (error: any) {
            console.error('Sync from cloud error:', error);
            setSyncState(prev => ({
                ...prev,
                status: 'error',
                error: error.message || 'Failed to sync from cloud',
            }));
        } finally {
            syncInProgress.current = false;
        }
    }, [isAuthenticated, user]);

    /**
     * Force sync now
     */
    const forceSync = useCallback(async () => {
        await syncToCloud();
    }, [syncToCloud]);

    /**
     * Clear sync error
     */
    const clearError = useCallback(() => {
        setSyncState(prev => ({ ...prev, error: null, status: 'idle' }));
    }, []);

    return {
        syncState,
        syncToCloud,
        syncFromCloud,
        forceSync,
        clearError,
        isAuthenticated,
    };
}
