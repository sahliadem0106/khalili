/**
 * GoalsService - Spiritual goals tracking with Firebase
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
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// =================== TYPES ===================

export type GoalCategory =
    | 'prayer'
    | 'quran'
    | 'dhikr'
    | 'fasting'
    | 'charity'
    | 'knowledge'
    | 'character'
    | 'community';

export type GoalFrequency = 'daily' | 'weekly' | 'monthly' | 'once';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export interface Goal {
    id: string;
    title: string;
    description: string | null;
    category: GoalCategory;
    frequency: GoalFrequency;
    targetCount: number;
    currentCount: number;
    unit: string; // e.g., "rakaat", "pages", "minutes", "times"
    startDate: Date;
    endDate: Date | null;
    status: GoalStatus;
    streak: number;
    longestStreak: number;
    lastLogDate: Date | null;
    reminders: boolean;
    reminderTime: string | null; // HH:MM format
    createdAt: Date;
    updatedAt: Date;
}

export interface GoalLog {
    id: string;
    goalId: string;
    date: string; // YYYY-MM-DD
    count: number;
    note: string | null;
    createdAt: Date;
}

export interface GoalStats {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    overallProgress: number;
    currentStreaks: number;
}

// =================== CONSTANTS ===================

const GOALS_COLLECTION = 'goals';
const GOAL_LOGS_COLLECTION = 'goalLogs';

export const GOAL_CATEGORIES: { id: GoalCategory; name: string; nameAr: string; icon: string }[] = [
    { id: 'prayer', name: 'Prayer', nameAr: 'الصلاة', icon: '🕌' },
    { id: 'quran', name: 'Quran', nameAr: 'القرآن', icon: '📖' },
    { id: 'dhikr', name: 'Dhikr', nameAr: 'الذكر', icon: '📿' },
    { id: 'fasting', name: 'Fasting', nameAr: 'الصيام', icon: '🌙' },
    { id: 'charity', name: 'Charity', nameAr: 'الصدقة', icon: '💝' },
    { id: 'knowledge', name: 'Knowledge', nameAr: 'العلم', icon: '🎓' },
    { id: 'character', name: 'Character', nameAr: 'الأخلاق', icon: '💎' },
    { id: 'community', name: 'Community', nameAr: 'المجتمع', icon: '🤝' },
];

export const GOAL_PRESETS: Omit<Goal, 'id' | 'currentCount' | 'streak' | 'longestStreak' | 'lastLogDate' | 'createdAt' | 'updatedAt' | 'status'>[] = [
    { title: 'Pray 5 times daily', description: 'Complete all 5 daily prayers on time', category: 'prayer', frequency: 'daily', targetCount: 5, unit: 'prayers', startDate: new Date(), endDate: null, reminders: true, reminderTime: '05:00' },
    { title: 'Read 1 page of Quran', description: 'Read at least one page of Quran daily', category: 'quran', frequency: 'daily', targetCount: 1, unit: 'pages', startDate: new Date(), endDate: null, reminders: true, reminderTime: '06:00' },
    { title: 'Morning Adhkar', description: 'Complete morning remembrance after Fajr', category: 'dhikr', frequency: 'daily', targetCount: 1, unit: 'sessions', startDate: new Date(), endDate: null, reminders: true, reminderTime: '06:30' },
    { title: 'Evening Adhkar', description: 'Complete evening remembrance after Asr', category: 'dhikr', frequency: 'daily', targetCount: 1, unit: 'sessions', startDate: new Date(), endDate: null, reminders: true, reminderTime: '17:00' },
    { title: 'Fast Mondays & Thursdays', description: 'Sunnah fasting twice a week', category: 'fasting', frequency: 'weekly', targetCount: 2, unit: 'days', startDate: new Date(), endDate: null, reminders: true, reminderTime: '20:00' },
    { title: 'Weekly Sadaqah', description: 'Give charity every week', category: 'charity', frequency: 'weekly', targetCount: 1, unit: 'donations', startDate: new Date(), endDate: null, reminders: false, reminderTime: null },
    { title: 'Attend Friday Prayer', description: 'Pray Jummah at the mosque', category: 'community', frequency: 'weekly', targetCount: 1, unit: 'prayers', startDate: new Date(), endDate: null, reminders: true, reminderTime: '12:00' },
    { title: 'Learn a Hadith', description: 'Memorize or study one hadith weekly', category: 'knowledge', frequency: 'weekly', targetCount: 1, unit: 'hadiths', startDate: new Date(), endDate: null, reminders: false, reminderTime: null },
];

// =================== SERVICE CLASS ===================

class GoalsService {
    private userId: string | null = null;

    /**
     * Set current user ID
     */
    setUserId(userId: string | null): void {
        this.userId = userId;
    }

    /**
     * Get goals collection reference
     */
    private getGoalsRef() {
        if (!this.userId) throw new Error('User not authenticated');
        return collection(db, 'users', this.userId, GOALS_COLLECTION);
    }

    /**
     * Get goal logs collection reference
     */
    private getGoalLogsRef(goalId: string) {
        if (!this.userId) throw new Error('User not authenticated');
        return collection(db, 'users', this.userId, GOALS_COLLECTION, goalId, GOAL_LOGS_COLLECTION);
    }

    /**
     * Create a new goal
     */
    async createGoal(goal: Omit<Goal, 'id' | 'currentCount' | 'streak' | 'longestStreak' | 'lastLogDate' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Goal | null> {
        if (!this.userId) return null;

        const docRef = doc(this.getGoalsRef());
        const newGoal: Goal = {
            ...goal,
            id: docRef.id,
            currentCount: 0,
            streak: 0,
            longestStreak: 0,
            lastLogDate: null,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await setDoc(docRef, {
            ...newGoal,
            startDate: Timestamp.fromDate(goal.startDate),
            endDate: goal.endDate ? Timestamp.fromDate(goal.endDate) : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return newGoal;
    }

    /**
     * Get all goals
     */
    async getGoals(): Promise<Goal[]> {
        if (!this.userId) return [];

        const q = query(this.getGoalsRef(), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => this.docToGoal(doc));
    }

    /**
     * Get active goals only
     */
    async getActiveGoals(): Promise<Goal[]> {
        const goals = await this.getGoals();
        return goals.filter(g => g.status === 'active');
    }

    /**
     * Update a goal
     */
    async updateGoal(goalId: string, updates: Partial<Goal>): Promise<boolean> {
        if (!this.userId) return false;

        const docRef = doc(this.getGoalsRef(), goalId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
        return true;
    }

    /**
     * Log progress for a goal
     */
    async logProgress(goalId: string, count: number, note?: string): Promise<boolean> {
        if (!this.userId) return false;

        const today = new Date().toISOString().split('T')[0];
        const logRef = doc(this.getGoalLogsRef(goalId), today);

        // Check if log exists for today
        const existingLog = await getDoc(logRef);
        const existingCount = existingLog.exists() ? existingLog.data().count : 0;

        // Save/update log
        await setDoc(logRef, {
            goalId,
            date: today,
            count: existingCount + count,
            note: note || null,
            createdAt: existingLog.exists() ? existingLog.data().createdAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });

        // Update goal progress
        const goalRef = doc(this.getGoalsRef(), goalId);
        const goalDoc = await getDoc(goalRef);

        if (goalDoc.exists()) {
            const goalData = goalDoc.data();
            const newCurrentCount = (goalData.currentCount || 0) + count;
            const lastLog = goalData.lastLogDate ? (goalData.lastLogDate as Timestamp).toDate() : null;

            // Calculate streak
            let newStreak = goalData.streak || 0;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (!lastLog || lastLog.toISOString().split('T')[0] === yesterdayStr) {
                newStreak += 1;
            } else if (lastLog.toISOString().split('T')[0] !== today) {
                newStreak = 1;
            }

            const longestStreak = Math.max(newStreak, goalData.longestStreak || 0);

            await updateDoc(goalRef, {
                currentCount: newCurrentCount,
                streak: newStreak,
                longestStreak,
                lastLogDate: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: newCurrentCount >= goalData.targetCount ? 'completed' : 'active',
            });
        }
        return true;
    }

    /**
     * Get logs for a goal
     */
    async getGoalLogs(goalId: string, limit: number = 30): Promise<GoalLog[]> {
        if (!this.userId) return [];

        const q = query(this.getGoalLogsRef(goalId), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.slice(0, limit).map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                goalId: data.goalId,
                date: data.date,
                count: data.count,
                note: data.note,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            };
        });
    }

    /**
     * Delete a goal
     */
    async deleteGoal(goalId: string): Promise<boolean> {
        if (!this.userId) return false;

        const docRef = doc(this.getGoalsRef(), goalId);
        await deleteDoc(docRef);
        return true;
    }

    /**
     * Get goal statistics
     */
    async getStats(): Promise<GoalStats> {
        const goals = await this.getGoals();

        const activeGoals = goals.filter(g => g.status === 'active');
        const completedGoals = goals.filter(g => g.status === 'completed');

        const totalProgress = activeGoals.reduce((acc, g) => acc + (g.currentCount / g.targetCount), 0);
        const overallProgress = activeGoals.length > 0 ? (totalProgress / activeGoals.length) * 100 : 0;

        const currentStreaks = activeGoals.reduce((acc, g) => acc + g.streak, 0);

        return {
            totalGoals: goals.length,
            activeGoals: activeGoals.length,
            completedGoals: completedGoals.length,
            overallProgress,
            currentStreaks,
        };
    }

    /**
     * Convert Firestore document to Goal
     */
    private docToGoal(doc: any): Goal {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            description: data.description,
            category: data.category,
            frequency: data.frequency,
            targetCount: data.targetCount,
            currentCount: data.currentCount || 0,
            unit: data.unit,
            startDate: (data.startDate as Timestamp)?.toDate() || new Date(),
            endDate: data.endDate ? (data.endDate as Timestamp).toDate() : null,
            status: data.status,
            streak: data.streak || 0,
            longestStreak: data.longestStreak || 0,
            lastLogDate: data.lastLogDate ? (data.lastLogDate as Timestamp).toDate() : null,
            reminders: data.reminders,
            reminderTime: data.reminderTime,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
        };
    }
}

// Export singleton
export const goalsService = new GoalsService();
