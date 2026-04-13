/**
 * ReflectionsService - Manages user reflections on Quran verses
 * Offline-first with cloud sync via Firebase
 */

import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// =================== TYPES ===================

export interface QuranReflection {
    id: string;                    // UUID
    userId: string;                // Firebase UID or 'local' for guest users
    surahNumber: number;           // 1-114
    ayahNumber: number;            // Ayah within surah
    verseKey: string;              // Format: "1:1"
    reflection: string;            // User's reflection text
    tags: string[];                // Tags for organization
    createdAt: Date;
    updatedAt: Date;
    syncedAt?: Date;               // Last cloud sync time
}

// =================== CONSTANTS ===================

const STORAGE_KEY_REFLECTIONS = 'muslimDaily_reflections';
const REFLECTIONS_COLLECTION = 'quranReflections';

// =================== HELPER FUNCTIONS ===================

/**
 * Generate a simple UUID v4
 */
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Convert Firestore timestamp to Date
 */
function timestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
}

// =================== SERVICE CLASS ===================

class ReflectionsService {
    private reflections: Map<string, QuranReflection> = new Map();
    private userId: string | null = null;
    private listeners: Set<() => void> = new Set();

    constructor() {
        this.loadFromLocalStorage();

        // Listen for auth changes
        if (auth) {
            onAuthStateChanged(auth, (user) => {
                this.setUserId(user ? user.uid : null);
            });
        }
    }

    /**
     * Set user ID for cloud sync
     */
    setUserId(userId: string | null): void {
        this.userId = userId;
        if (userId) {
            // Trigger sync when user logs in
            this.syncFromCloud().catch(console.error);
        }
    }

    /**
     * Get all reflections
     */
    getAllReflections(): QuranReflection[] {
        return Array.from(this.reflections.values()).sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }

    /**
     * Get reflections for a specific verse
     */
    getReflectionsByVerse(surahNumber: number, ayahNumber: number): QuranReflection[] {
        const verseKey = `${surahNumber}:${ayahNumber}`;
        return this.getAllReflections().filter(r => r.verseKey === verseKey);
    }

    /**
     * Get reflection by ID
     */
    getReflectionById(id: string): QuranReflection | null {
        return this.reflections.get(id) || null;
    }

    /**
     * Create a new reflection
     */
    async createReflection(data: Omit<QuranReflection, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncedAt'>): Promise<QuranReflection> {
        const now = new Date();
        const reflection: QuranReflection = {
            id: generateId(),
            userId: this.userId || 'local',
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        this.reflections.set(reflection.id, reflection);
        this.saveToLocalStorage();
        this.notifyListeners();

        // Sync to cloud if user is authenticated
        if (this.userId) {
            await this.syncReflectionToCloud(reflection);
        }

        return reflection;
    }

    /**
     * Update an existing reflection
     */
    async updateReflection(id: string, updates: Partial<Pick<QuranReflection, 'reflection' | 'tags'>>): Promise<void> {
        const existing = this.reflections.get(id);
        if (!existing) throw new Error('Reflection not found');

        const updated: QuranReflection = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
        };

        this.reflections.set(id, updated);
        this.saveToLocalStorage();
        this.notifyListeners();

        // Sync to cloud if user is authenticated
        if (this.userId) {
            await this.syncReflectionToCloud(updated);
        }
    }

    /**
     * Delete a reflection
     */
    async deleteReflection(id: string): Promise<void> {
        const reflection = this.reflections.get(id);
        if (!reflection) return;

        this.reflections.delete(id);
        this.saveToLocalStorage();
        this.notifyListeners();

        // Delete from cloud if user is authenticated
        if (this.userId && reflection.syncedAt) {
            try {
                await deleteDoc(doc(db, REFLECTIONS_COLLECTION, id));
            } catch (error) {
                console.error('Failed to delete reflection from cloud:', error);
            }
        }
    }

    /**
     * Sync single reflection to cloud
     */
    private async syncReflectionToCloud(reflection: QuranReflection): Promise<void> {
        if (!this.userId) return;

        try {
            const reflectionData = {
                ...reflection,
                createdAt: reflection.createdAt.toISOString(),
                updatedAt: reflection.updatedAt.toISOString(),
                syncedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, REFLECTIONS_COLLECTION, reflection.id), reflectionData);

            // Update local syncedAt
            const updated = { ...reflection, syncedAt: new Date() };
            this.reflections.set(reflection.id, updated);
            this.saveToLocalStorage();
        } catch (error: any) {
            // Handle permission errors gracefully - data is still saved locally
            if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
                console.warn('Cloud sync disabled - reflection saved locally only');
            } else {
                console.error('Failed to sync reflection to cloud:', error);
            }
            // Don't throw - reflection is still saved locally
        }
    }

    /**
     * Sync all reflections to cloud
     */
    async syncToCloud(): Promise<void> {
        if (!this.userId) return;

        const reflections = this.getAllReflections();
        const syncPromises = reflections.map(r => this.syncReflectionToCloud(r));

        try {
            await Promise.all(syncPromises);
            console.log(`Synced ${reflections.length} reflections to cloud`);
        } catch (error) {
            console.error('Failed to sync reflections to cloud:', error);
            throw error;
        }
    }

    /**
     * Sync reflections from cloud
     */
    async syncFromCloud(): Promise<void> {
        if (!this.userId) return;

        try {
            const q = query(
                collection(db, REFLECTIONS_COLLECTION),
                where('userId', '==', this.userId)
            );
            const snapshot = await getDocs(q);

            snapshot.forEach((doc) => {
                const data = doc.data();
                const reflection: QuranReflection = {
                    id: doc.id,
                    userId: data.userId,
                    surahNumber: data.surahNumber,
                    ayahNumber: data.ayahNumber,
                    verseKey: data.verseKey,
                    reflection: data.reflection,
                    tags: data.tags || [],
                    createdAt: new Date(data.createdAt),
                    updatedAt: new Date(data.updatedAt),
                    syncedAt: data.syncedAt ? new Date(data.syncedAt) : undefined,
                };

                this.reflections.set(reflection.id, reflection);
            });

            this.saveToLocalStorage();
            this.notifyListeners();
            console.log(`Synced ${snapshot.size} reflections from cloud`);
        } catch (error: any) {
            // Handle permission errors gracefully - just use offline mode
            if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
                console.warn('Cloud sync disabled - using offline mode for reflections');
            } else {
                console.error('Failed to sync reflections from cloud:', error);
            }
            // Don't throw - allow app to continue with offline data
        }
    }

    /**
     * Subscribe to changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Save reflections to localStorage
     */
    private saveToLocalStorage(): void {
        try {
            const reflections = this.getAllReflections();
            const serialized = reflections.map(r => ({
                ...r,
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString(),
                syncedAt: r.syncedAt?.toISOString(),
            }));
            localStorage.setItem(STORAGE_KEY_REFLECTIONS, JSON.stringify(serialized));
        } catch (error) {
            console.error('Failed to save reflections to localStorage:', error);
        }
    }

    /**
     * Load reflections from localStorage
     */
    private loadFromLocalStorage(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_REFLECTIONS);
            if (!saved) return;

            const reflections: any[] = JSON.parse(saved);
            reflections.forEach(r => {
                const reflection: QuranReflection = {
                    ...r,
                    createdAt: new Date(r.createdAt),
                    updatedAt: new Date(r.updatedAt),
                    syncedAt: r.syncedAt ? new Date(r.syncedAt) : undefined,
                };
                this.reflections.set(reflection.id, reflection);
            });

            console.log(`Loaded ${reflections.length} reflections from localStorage`);
        } catch (error) {
            console.error('Failed to load reflections from localStorage:', error);
        }
    }

    /**
     * Clear all reflections (use with caution)
     */
    clearAll(): void {
        this.reflections.clear();
        this.saveToLocalStorage();
        this.notifyListeners();
    }
}

// Export singleton instance
export const reflectionsService = new ReflectionsService();
