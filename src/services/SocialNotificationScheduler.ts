import { notificationService } from './NotificationService';
import { prayerTimesService } from './PrayerTimesService';
import {
    DEFAULT_SOCIAL_NOTIFICATION_DELIVERY_SETTINGS,
    SocialNotificationDeliverySettings,
    SocialNotificationPolicy,
} from '../types/socialNotificationPolicy';
import { socialNotificationPolicyService } from './SocialNotificationPolicyService';
import { locationService } from './LocationService';

const STORAGE_KEY = 'khalil_social_notification_scheduler_state';

interface SchedulerState {
    scheduledIds: string[];
    policyHash: string;
    lastSyncedAt: string | null;
}

export interface SocialSchedulerDebugState extends SchedulerState {
    isAutoRefreshRunning: boolean;
}

const DEFAULT_STATE: SchedulerState = {
    scheduledIds: [],
    policyHash: '',
    lastSyncedAt: null,
};

class SocialNotificationScheduler {
    private state: SchedulerState = this.loadState();
    private refreshIntervalId: number | null = null;

    private loadState(): SchedulerState {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULT_STATE };
            return { ...DEFAULT_STATE, ...JSON.parse(raw) };
        } catch {
            return { ...DEFAULT_STATE };
        }
    }

    private saveState(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    private getUserDeliverySettings(): SocialNotificationDeliverySettings {
        const settings = notificationService.getSettings();
        return {
            ...DEFAULT_SOCIAL_NOTIFICATION_DELIVERY_SETTINGS,
            ...settings.socialNotificationDelivery,
        };
    }

    private isInQuietHours(now: Date, settings: SocialNotificationDeliverySettings): boolean {
        if (!settings.quietHoursEnabled) return false;

        const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
        const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (startMinutes < endMinutes) {
            return nowMinutes >= startMinutes && nowMinutes < endMinutes;
        }
        return nowMinutes >= startMinutes || nowMinutes < endMinutes;
    }

    private policyToHashable(policy: SocialNotificationPolicy): string {
        return JSON.stringify({
            id: policy.id,
            scope: policy.scope,
            ruleType: policy.ruleType,
            message: policy.message,
            title: policy.title,
            enabled: policy.enabled,
            dailyTime: policy.dailyTime,
            oneTimeAt: policy.oneTimeAt,
            prayerName: policy.prayerName,
            hourlyIntervalMinutes: policy.hourlyIntervalMinutes,
            version: policy.version,
        });
    }

    private async schedulePolicy(policy: SocialNotificationPolicy): Promise<string[]> {
        const scheduledIds: string[] = [];
        const now = new Date();
        const settings = this.getUserDeliverySettings();
        if (settings.mutedScopes.includes(policy.scope)) return scheduledIds;
        if (this.isInQuietHours(now, settings)) return scheduledIds;

        if (policy.ruleType === 'oneTime' && policy.oneTimeAt) {
            const triggerAt = new Date(policy.oneTimeAt as string);
            const id = `social_${policy.id}_once`;
            await notificationService.schedule(id, policy.title, policy.message, triggerAt);
            scheduledIds.push(id);
            return scheduledIds;
        }

        if (policy.ruleType === 'dailyTime' && policy.dailyTime) {
            const [hour, minute] = policy.dailyTime.split(':').map(Number);
            const triggerAt = new Date();
            triggerAt.setHours(hour, minute, 0, 0);
            if (triggerAt <= now) triggerAt.setDate(triggerAt.getDate() + 1);
            const id = `social_${policy.id}_daily`;
            await notificationService.schedule(id, policy.title, policy.message, triggerAt);
            scheduledIds.push(id);
            return scheduledIds;
        }

        if (policy.ruleType === 'hourly') {
            const interval = Math.max(15, policy.hourlyIntervalMinutes || 60);
            const triggerAt = new Date(now.getTime() + interval * 60 * 1000);
            const id = `social_${policy.id}_hourly`;
            await notificationService.schedule(id, policy.title, policy.message, triggerAt);
            scheduledIds.push(id);
            return scheduledIds;
        }

        if (policy.ruleType === 'prayerLinked' && policy.prayerName) {
            const location = locationService.loadLocation();
            if (!location) return scheduledIds;
            const prayerTimes = prayerTimesService.getTodaysTimes(location);
            const time = prayerTimes[policy.prayerName];
            const id = `social_${policy.id}_prayer_${policy.prayerName}`;
            await notificationService.schedule(id, policy.title, policy.message, time);
            scheduledIds.push(id);
            return scheduledIds;
        }

        return scheduledIds;
    }

    async reconcile(userId: string): Promise<void> {
        const settings = this.getUserDeliverySettings();
        if (!settings.socialRuleSyncEnabled) return;

        const policies = await socialNotificationPolicyService.fetchPoliciesForUser(userId);
        const enabledPolicies = policies.filter((p) => p.enabled);
        const policyHash = enabledPolicies
            .map((p) => this.policyToHashable(p))
            .sort()
            .join('|');

        if (policyHash === this.state.policyHash) return;

        for (const id of this.state.scheduledIds) {
            await notificationService.cancel(id);
        }

        const nextScheduledIds: string[] = [];
        for (const policy of enabledPolicies) {
            const ids = await this.schedulePolicy(policy);
            nextScheduledIds.push(...ids);
        }

        this.state = {
            scheduledIds: nextScheduledIds,
            policyHash,
            lastSyncedAt: new Date().toISOString(),
        };
        this.saveState();
    }

    startAutoRefresh(userId: string): void {
        this.stopAutoRefresh();
        this.reconcile(userId).catch(console.error);
        this.refreshIntervalId = window.setInterval(() => {
            this.reconcile(userId).catch(console.error);
        }, 5 * 60 * 1000);
    }

    stopAutoRefresh(): void {
        if (this.refreshIntervalId) {
            window.clearInterval(this.refreshIntervalId);
            this.refreshIntervalId = null;
        }
    }

    async clearAllScheduled(): Promise<void> {
        for (const id of this.state.scheduledIds) {
            await notificationService.cancel(id);
        }
        this.state = { ...DEFAULT_STATE };
        this.saveState();
    }

    getDebugState(): SocialSchedulerDebugState {
        return {
            ...this.state,
            isAutoRefreshRunning: this.refreshIntervalId !== null,
        };
    }
}

export const socialNotificationScheduler = new SocialNotificationScheduler();
