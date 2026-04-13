/**
 * MetricsService - Computes all user metrics from real data
 * Heart state, streaks, on-time rate, average khushu, level
 */

import { prayerLogService, PrayerLogEntry } from './PrayerLogService';
import { PrayerStatus } from '../types';

// =================== TYPES ===================

export interface UserMetrics {
    prayerStreak: number;       // Consecutive days all prayers done
    heartState: number;         // 0-100
    onTimeRate: number;         // 0-100 percentage
    avgKhushu: number;          // 0-5
    totalPrayers: number;
    level: number;              // Based on total engagement
    lastCalculated: string;     // ISO timestamp
}

// =================== SERVICE CLASS ===================

class MetricsService {
    private cachedMetrics: UserMetrics | null = null;
    private listeners: Set<(metrics: UserMetrics) => void> = new Set();

    constructor() {
        // Recalculate when prayer logs change
        prayerLogService.subscribe(() => {
            this.invalidateCache();
        });
    }

    /**
     * Get all metrics (uses cache)
     */
    getMetrics(): UserMetrics {
        if (this.cachedMetrics) {
            return this.cachedMetrics;
        }
        return this.calculateMetrics();
    }

    /**
     * Calculate all metrics from prayer logs
     */
    calculateMetrics(): UserMetrics {
        const last7DaysLogs = prayerLogService.getLogsForDays(7);
        const allLogs = prayerLogService.getLogs();

        const metrics: UserMetrics = {
            prayerStreak: prayerLogService.calculateStreak(),
            heartState: this.calculateHeartState(last7DaysLogs),
            onTimeRate: this.calculateOnTimeRate(last7DaysLogs),
            avgKhushu: this.calculateAvgKhushu(last7DaysLogs),
            totalPrayers: prayerLogService.getTotalPrayers(),
            level: this.calculateLevel(allLogs),
            lastCalculated: new Date().toISOString(),
        };

        this.cachedMetrics = metrics;
        this.notifyListeners(metrics);
        return metrics;
    }

    /**
     * Calculate heart state (spiritual health score 0-100)
     * Based on: prayer completion, khushu quality, barriers
     */
    private calculateHeartState(logs: PrayerLogEntry[]): number {
        if (logs.length === 0) return 50; // Baseline for new users

        let score = 50; // Start at 50%

        // Get unique days in the period
        const days = new Set(logs.map(l => l.date)).size;
        const maxPossible = days * 5; // 5 prayers per day

        // Add points for completed prayers (up to +30)
        const completedCount = logs.filter(l =>
            l.status !== PrayerStatus.Missed && l.status !== PrayerStatus.Upcoming
        ).length;
        if (maxPossible > 0) {
            score += (completedCount / maxPossible) * 30;
        }

        // Add points for khushu ratings (up to +15)
        const ratedPrayers = logs.filter(l => l.khushuLevel > 0);
        if (ratedPrayers.length > 0) {
            const avgKhushu = ratedPrayers.reduce((s, l) => s + l.khushuLevel, 0) / ratedPrayers.length;
            score += (avgKhushu / 5) * 15;
        }

        // Add bonus for on-time prayers (up to +5)
        const onTimeCount = logs.filter(l =>
            l.status === PrayerStatus.Jamaah || l.status === PrayerStatus.Home
        ).length;
        if (completedCount > 0) {
            score += (onTimeCount / completedCount) * 5;
        }

        // Subtract for missed prayers (-2 per missed)
        const missedCount = logs.filter(l => l.status === PrayerStatus.Missed).length;
        score -= missedCount * 2;

        // Subtract for late prayers (-0.5 per late)
        const lateCount = logs.filter(l => l.status === PrayerStatus.Late).length;
        score -= lateCount * 0.5;

        // Clamp to 0-100
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Calculate on-time rate (percentage of prayers on time)
     */
    private calculateOnTimeRate(logs: PrayerLogEntry[]): number {
        const completedLogs = logs.filter(l =>
            l.status !== PrayerStatus.Missed && l.status !== PrayerStatus.Upcoming
        );

        if (completedLogs.length === 0) return 0;

        const onTimeLogs = completedLogs.filter(l =>
            l.status === PrayerStatus.Jamaah || l.status === PrayerStatus.Home
        );

        return Math.round((onTimeLogs.length / completedLogs.length) * 100);
    }

    /**
     * Calculate average khushu rating
     */
    private calculateAvgKhushu(logs: PrayerLogEntry[]): number {
        const ratedLogs = logs.filter(l => l.khushuLevel > 0);

        if (ratedLogs.length === 0) return 0;

        const sum = ratedLogs.reduce((s, l) => s + l.khushuLevel, 0);
        return Math.round((sum / ratedLogs.length) * 10) / 10; // 1 decimal
    }

    /**
     * Calculate user level based on total engagement
     */
    private calculateLevel(logs: PrayerLogEntry[]): number {
        const completedCount = logs.filter(l =>
            l.status !== PrayerStatus.Missed && l.status !== PrayerStatus.Upcoming
        ).length;

        // Level thresholds: 0-50, 51-150, 151-300, 301-500, 501-750, ...
        if (completedCount <= 50) return 1;
        if (completedCount <= 150) return 2;
        if (completedCount <= 300) return 3;
        if (completedCount <= 500) return 4;
        if (completedCount <= 750) return 5;
        if (completedCount <= 1000) return 6;
        if (completedCount <= 1500) return 7;
        if (completedCount <= 2000) return 8;
        if (completedCount <= 3000) return 9;
        return 10; // Max level
    }

    /**
     * Invalidate cache (called when data changes)
     */
    invalidateCache(): void {
        this.cachedMetrics = null;
    }

    /**
     * Subscribe to metric updates
     */
    subscribe(listener: (metrics: UserMetrics) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(metrics: UserMetrics): void {
        this.listeners.forEach(listener => listener(metrics));
    }

    /**
     * Get heart state label
     */
    getHeartStateLabel(score: number): string {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Moderate';
        if (score >= 20) return 'Needs Attention';
        return 'Critical';
    }

    /**
     * Get heart state color class
     */
    getHeartStateColor(score: number): string {
        if (score >= 80) return 'text-brand-forest';
        if (score >= 60) return 'text-emerald-400';
        if (score >= 40) return 'text-yellow-500';
        if (score >= 20) return 'text-orange-500';
        return 'text-red-500';
    }
}

// Export singleton
export const metricsService = new MetricsService();
