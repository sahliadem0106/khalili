/**
 * useGoals - React hook for goals management
 */

import { useState, useEffect, useCallback } from 'react';
import {
    goalsService,
    Goal,
    GoalStats,
    GoalCategory,
    GOAL_CATEGORIES,
    GOAL_PRESETS
} from '../services/GoalsService';

interface UseGoalsReturn {
    // Data
    goals: Goal[];
    activeGoals: Goal[];
    stats: GoalStats | null;
    categories: typeof GOAL_CATEGORIES;
    presets: typeof GOAL_PRESETS;

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    createGoal: (goal: Omit<Goal, 'id' | 'currentCount' | 'streak' | 'longestStreak' | 'lastLogDate' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Goal>;
    updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
    deleteGoal: (goalId: string) => Promise<void>;
    logProgress: (goalId: string, count: number, note?: string) => Promise<void>;
    refreshGoals: () => Promise<void>;
}

export function useGoals(): UseGoalsReturn {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [stats, setStats] = useState<GoalStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load goals
    const refreshGoals = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [loadedGoals, loadedStats] = await Promise.all([
                goalsService.getGoals(),
                goalsService.getStats(),
            ]);
            setGoals(loadedGoals);
            setStats(loadedStats);
        } catch (e: any) {
            setError(e.message || 'Failed to load goals');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshGoals();
    }, [refreshGoals]);

    // Create goal
    const createGoal = useCallback(async (goal: Omit<Goal, 'id' | 'currentCount' | 'streak' | 'longestStreak' | 'lastLogDate' | 'createdAt' | 'updatedAt' | 'status'>) => {
        const newGoal = await goalsService.createGoal(goal);
        if (!newGoal) {
            setError('Sign in to use Goals');
            throw new Error('Sign in to use Goals');
        }
        setGoals(prev => [newGoal, ...prev]);
        return newGoal;
    }, []);

    // Update goal
    const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
        const ok = await goalsService.updateGoal(goalId, updates);
        if (!ok) {
            setError('Sign in to use Goals');
            return;
        }
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
    }, []);

    // Delete goal
    const deleteGoal = useCallback(async (goalId: string) => {
        const ok = await goalsService.deleteGoal(goalId);
        if (!ok) {
            setError('Sign in to use Goals');
            return;
        }
        setGoals(prev => prev.filter(g => g.id !== goalId));
    }, []);

    // Log progress
    const logProgress = useCallback(async (goalId: string, count: number, note?: string) => {
        const ok = await goalsService.logProgress(goalId, count, note);
        if (!ok) {
            setError('Sign in to use Goals');
            return;
        }
        await refreshGoals(); // Refresh to get updated stats
    }, [refreshGoals]);

    // Computed values
    const activeGoals = goals.filter(g => g.status === 'active');

    return {
        goals,
        activeGoals,
        stats,
        categories: GOAL_CATEGORIES,
        presets: GOAL_PRESETS,
        isLoading,
        error,
        createGoal,
        updateGoal,
        deleteGoal,
        logProgress,
        refreshGoals,
    };
}
