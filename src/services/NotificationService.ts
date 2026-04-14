/**
 * NotificationService - Handle browser push notifications for prayer times
 * Uses the Web Notifications API with scheduling
 */

import { CalculatedPrayerTimes } from './PrayerTimesService';
import { Capacitor } from '@capacitor/core';
import { AppNotificationType } from '../constants/notificationTypes';

// =================== TYPES ===================

export interface NotificationSettings {
    enabled: boolean;
    prayerNotifications: {
        fajr: NotificationTiming;
        dhuhr: NotificationTiming;
        asr: NotificationTiming;
        maghrib: NotificationTiming;
        isha: NotificationTiming;
    };
    missedPrayerReminder: boolean;
    missedReminderDelayMinutes: number;
    soundEnabled: boolean;
    adhanOverlayEnabled: boolean;
    adhanSoundEnabled: boolean;
    socialNotificationDelivery: {
        socialRuleSyncEnabled: boolean;
        mutedScopes: Array<'partner' | 'family' | 'suhba'>;
        quietHoursEnabled: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
    };
}

export interface NotificationTiming {
    enabled: boolean;
    timing: 'atTime' | 'before5' | 'before10' | 'before15' | 'before30';
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

// =================== CONSTANTS ===================

const STORAGE_KEY = 'khalil_notification_settings';
const NATIVE_PERMISSION_KEY = 'khalil_native_notification_permission';

const TIMING_OFFSETS: Record<NotificationTiming['timing'], number> = {
    atTime: 0,
    before5: 5 * 60 * 1000,
    before10: 10 * 60 * 1000,
    before15: 15 * 60 * 1000,
    before30: 30 * 60 * 1000,
};

const PRAYER_MESSAGES = {
    fajr: {
        title: 'Fajr Prayer',
        titleAr: 'صلاة الفجر',
        body: 'Time to pray Fajr 🌅',
        bodyAr: 'حان وقت صلاة الفجر',
    },
    dhuhr: {
        title: 'Dhuhr Prayer',
        titleAr: 'صلاة الظهر',
        body: 'Time to pray Dhuhr ☀️',
        bodyAr: 'حان وقت صلاة الظهر',
    },
    asr: {
        title: 'Asr Prayer',
        titleAr: 'صلاة العصر',
        body: 'Time to pray Asr 🌤',
        bodyAr: 'حان وقت صلاة العصر',
    },
    maghrib: {
        title: 'Maghrib Prayer',
        titleAr: 'صلاة المغرب',
        body: 'Time to pray Maghrib 🌅',
        bodyAr: 'حان وقت صلاة المغرب',
    },
    isha: {
        title: 'Isha Prayer',
        titleAr: 'صلاة العشاء',
        body: 'Time to pray Isha 🌙',
        bodyAr: 'حان وقت صلاة العشاء',
    },
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    prayerNotifications: {
        fajr: { enabled: true, timing: 'atTime' },
        dhuhr: { enabled: true, timing: 'atTime' },
        asr: { enabled: true, timing: 'atTime' },
        maghrib: { enabled: true, timing: 'atTime' },
        isha: { enabled: true, timing: 'atTime' },
    },
    missedPrayerReminder: true,
    missedReminderDelayMinutes: 30,
    soundEnabled: true,
    adhanOverlayEnabled: true,
    adhanSoundEnabled: true,
    socialNotificationDelivery: {
        socialRuleSyncEnabled: true,
        mutedScopes: [],
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
    },
};

// =================== SERVICE CLASS ===================

class NotificationService {
    private scheduledTimeouts: Map<string, number> = new Map();
    private nativeScheduledIds: Map<string, number> = new Map();
    private settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
    private nativePermissionStatus: NotificationPermissionStatus = 'default';

    constructor() {
        this.loadSettings();
        this.loadNativePermissionStatus();
    }

    /**
     * Check if notifications are supported
     */
    isSupported(): boolean {
        return this.isNativeAndroid() || ('Notification' in window);
    }

    private isNativeAndroid(): boolean {
        return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    }

    private getNativeNotificationId(id: string): number {
        // Stable positive 32-bit integer for Capacitor local notifications.
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = (hash * 31 + id.charCodeAt(i)) | 0;
        }
        return Math.abs(hash) + 1;
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): NotificationPermissionStatus {
        if (this.isNativeAndroid()) {
            return this.nativePermissionStatus;
        }
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission as NotificationPermissionStatus;
    }

    /**
     * Request notification permission from user
     */
    async requestPermission(): Promise<NotificationPermissionStatus> {
        try {
            if (this.isNativeAndroid()) {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                const result = await LocalNotifications.requestPermissions();
                const status: NotificationPermissionStatus = result.display === 'granted' ? 'granted' : 'denied';
                this.nativePermissionStatus = status;
                localStorage.setItem(NATIVE_PERMISSION_KEY, status);
                return status;
            }

            if (!this.isSupported()) {
                return 'unsupported';
            }

            const result = await Notification.requestPermission();
            return result as NotificationPermissionStatus;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    /**
     * Show a notification immediately.
     * Prefers ServiceWorker-based notifications for persistence.
     */
    async show(title: string, options?: NotificationOptions): Promise<Notification | null> {
        const permission = this.getPermissionStatus();
        if (!this.isSupported() || permission !== 'granted') {
            console.warn('Notifications not available or permission not granted');
            return null;
        }

        try {
            if (this.isNativeAndroid()) {
                // For native local notifications, immediate display can be simulated as near-immediate schedule.
                const id = `instant_${Date.now()}`;
                await this.schedule(id, title, options?.body || '', new Date(Date.now() + 1000));
                return null;
            }

            // Prefer Service Worker registration for persistent notifications
            const swReg = await this.getServiceWorkerRegistration();
            if (swReg) {
                await swReg.showNotification(title, {
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    requireInteraction: true,
                    ...options,
                });
                return null; // SW notifications don't return Notification objects
            }

            // Fallback: basic Notification API (dies with tab)
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                requireInteraction: true,
                ...options,
            });

            // Auto-close after 30 seconds
            setTimeout(() => notification.close(), 30000);

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    /**
     * Get Service Worker registration (if available).
     */
    private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
        if (!('serviceWorker' in navigator)) return null;
        try {
            return await navigator.serviceWorker.ready;
        } catch {
            return null;
        }
    }

    /**
     * Schedule a notification for a future time.
     * Uses setTimeout as the trigger mechanism, but shows via ServiceWorker
     * for persistence. Note: setTimeout timers still die when the tab closes.
     * For true background scheduling, a push notification server (FCM) is needed.
     */
    async schedule(
        id: string,
        title: string,
        body: string,
        scheduledTime: Date
    ): Promise<void> {
        // Cancel any existing notification with this ID
        await this.cancel(id);

        const now = new Date();
        const delay = scheduledTime.getTime() - now.getTime();

        if (delay <= 0) {
            // Time has already passed
            return;
        }

        if (this.isNativeAndroid()) {
            try {
                if (this.nativePermissionStatus !== 'granted') {
                    const permission = await this.requestPermission();
                    if (permission !== 'granted') {
                        return;
                    }
                }
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                const nativeId = this.getNativeNotificationId(id);
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            id: nativeId,
                            title,
                            body,
                            schedule: { at: scheduledTime },
                            extra: { tag: id },
                        },
                    ],
                });
                this.nativeScheduledIds.set(id, nativeId);
                return;
            } catch (error) {
                console.error('Failed native notification schedule, falling back to timeout:', error);
            }
        }

        // Cap setTimeout at ~24 days (2^31-1 ms) to avoid overflow
        const safeDelay = Math.min(delay, 2147483647);

        const timeoutId = window.setTimeout(() => {
            this.show(title, { body, tag: id });
            this.scheduledTimeouts.delete(id);
        }, safeDelay);

        this.scheduledTimeouts.set(id, timeoutId);
    }

    /**
     * Cancel a scheduled notification
     */
    async cancel(id: string): Promise<void> {
        const timeoutId = this.scheduledTimeouts.get(id);
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            this.scheduledTimeouts.delete(id);
        }

        const nativeId = this.nativeScheduledIds.get(id);
        if (nativeId) {
            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                await LocalNotifications.cancel({ notifications: [{ id: nativeId }] });
            } catch (error) {
                console.error('Failed to cancel native notification:', error);
            }
            this.nativeScheduledIds.delete(id);
        }
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAll(): Promise<void> {
        this.scheduledTimeouts.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        this.scheduledTimeouts.clear();

        if (this.nativeScheduledIds.size > 0) {
            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                const notifications = Array.from(this.nativeScheduledIds.values()).map((id) => ({ id }));
                await LocalNotifications.cancel({ notifications });
            } catch (error) {
                console.error('Failed to cancel all native notifications:', error);
            }
            this.nativeScheduledIds.clear();
        }
    }

    /**
     * Schedule notifications for all today's prayers
     */
    schedulePrayerNotifications(
        prayerTimes: CalculatedPrayerTimes,
        language: 'en' | 'ar' = 'en'
    ): void {
        // Cancel existing prayer notifications
        ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(prayer => {
            this.cancel(`prayer_${prayer}`);
            this.cancel(`prayer_${prayer}_reminder`);
        });

        if (!this.settings.enabled) {
            return;
        }

        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
        const now = new Date();

        prayers.forEach(prayer => {
            const prayerSetting = this.settings.prayerNotifications[prayer];
            if (!prayerSetting.enabled) {
                return;
            }

            const prayerTime = prayerTimes[prayer];
            const offset = TIMING_OFFSETS[prayerSetting.timing];
            const notificationTime = new Date(prayerTime.getTime() - offset);

            // Only schedule if the notification time is in the future
            if (notificationTime > now) {
                const messages = PRAYER_MESSAGES[prayer];
                const title = language === 'ar' ? messages.titleAr : messages.title;
                const body = language === 'ar' ? messages.bodyAr : messages.body;

                this.schedule(`prayer_${prayer}`, title, body, notificationTime);
            }

            // Schedule missed prayer reminder
            if (this.settings.missedPrayerReminder) {
                const reminderTime = new Date(
                    prayerTime.getTime() + this.settings.missedReminderDelayMinutes * 60 * 1000
                );

                if (reminderTime > now) {
                    const messages = PRAYER_MESSAGES[prayer];
                    const title = language === 'ar'
                        ? `هل صليت ${messages.titleAr}؟`
                        : `Did you pray ${messages.title}?`;
                    const body = language === 'ar'
                        ? 'لا تنس صلاتك 🤲'
                        : "Don't forget your prayer 🤲";

                    this.schedule(`prayer_${prayer}_reminder`, title, body, reminderTime);
                }
            }
        });
    }

    /**
     * Test notification (for settings page)
     */
    async sendTestNotification(): Promise<boolean> {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
            return false;
        }

        const notification = await this.show('Test Notification', {
            body: 'Notifications are working! 🎉',
            tag: 'test',
        });

        return notification !== null;
    }

    /**
     * Load settings from localStorage
     */
    loadSettings(): NotificationSettings {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = {
                    ...DEFAULT_NOTIFICATION_SETTINGS,
                    ...parsed,
                    prayerNotifications: {
                        ...DEFAULT_NOTIFICATION_SETTINGS.prayerNotifications,
                        ...(parsed.prayerNotifications || {}),
                    },
                    socialNotificationDelivery: {
                        ...DEFAULT_NOTIFICATION_SETTINGS.socialNotificationDelivery,
                        ...(parsed.socialNotificationDelivery || {}),
                    },
                };
            }
        } catch (e) {
            console.error('Failed to load notification settings:', e);
        }
        return this.settings;
    }

    private loadNativePermissionStatus(): void {
        try {
            const stored = localStorage.getItem(NATIVE_PERMISSION_KEY);
            if (stored === 'granted' || stored === 'denied' || stored === 'default') {
                this.nativePermissionStatus = stored;
            }
        } catch (e) {
            console.error('Failed to load native notification permission status:', e);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings(settings: NotificationSettings): void {
        this.settings = settings;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save notification settings:', e);
        }
    }

    /**
     * Get current settings
     */
    getSettings(): NotificationSettings {
        return this.settings;
    }

    /**
     * Update a specific setting
     */
    updateSetting<K extends keyof NotificationSettings>(
        key: K,
        value: NotificationSettings[K]
    ): void {
        this.settings[key] = value;
        this.saveSettings(this.settings);
    }

    // =================== PARTNER NOTIFICATIONS ===================

    /**
     * Show a partner/group notification (reminder, broadcast, etc.)
     */
    showPartnerNotification(title: string, body: string, data?: { type?: string; fromUser?: string }): void {
        this.show(title, {
            body,
            tag: `partner-${Date.now()}`,
            data,
        });
    }

    /**
     * Mark a notification as delivered in Firestore
     */
    async markAsDelivered(notificationId: string): Promise<void> {
        try {
            // Dynamic import to avoid circular dependency
            const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
            const { db } = await import('./firebase');

            await updateDoc(doc(db, 'notifications', notificationId), {
                delivered: true,
                deliveredAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Failed to mark notification as delivered:', error);
        }
    }

    /**
     * Subscribe to notifications for a user using polling (optimized from real-time)
     * Polls every 30 seconds instead of real-time listener to reduce Firebase reads
     * Returns unsubscribe function
     */
    subscribeToNotifications(
        userId: string,
        onNotification: (notification: { id: string; message: string; type: string; fromUserId: string }) => void
    ): () => void {
        let unsubscribe = () => {};

        const setupListener = async () => {
            try {
                const { collection, query, where, doc, updateDoc, Timestamp, onSnapshot } = await import('firebase/firestore');
                const { db } = await import('./firebase');

                const q = query(
                    collection(db, 'notifications'),
                    where('toUserId', '==', userId),
                    where('delivered', '==', false)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    snapshot.docChanges().forEach(async (change) => {
                        if (change.type === 'added') {
                            const data = change.doc.data();
                            const notification = {
                                id: change.doc.id,
                                message: data.message || 'New notification',
                                type: data.type || 'reminder',
                                fromUserId: data.fromUserId || '',
                            };

                            // Show browser notification
                            this.showPartnerNotification(
                                this.getNotificationTitle(notification.type),
                                notification.message,
                                { type: notification.type, fromUser: notification.fromUserId }
                            );

                            // Mark as delivered
                            await updateDoc(doc(db, 'notifications', notification.id), {
                                delivered: true,
                                deliveredAt: Timestamp.now()
                            });

                            // Callback
                            onNotification(notification);
                        }
                    });
                }, (error) => {
                    console.error('Notification snapshot listener error:', error);
                });

            } catch (error) {
                console.error('Failed to setup notifications listener:', error);
            }
        };

        setupListener();

        return () => unsubscribe();
    }

    /**
     * Get title based on notification type
     */
    private getNotificationTitle(type: string): string {
        const typeTitleMap: Partial<Record<AppNotificationType, string>> = {
            adhan_reminder: '🕌 Prayer Reminder',
            reminder: '⏰ Partner Reminder',
            broadcast: '📢 Circle Broadcast',
            invite: '👋 New Invitation',
            partner_request: '🤝 Partner Request',
            request_accepted: '✅ Request Accepted',
            request_rejected: '❌ Request Rejected',
        };
        return typeTitleMap[type as AppNotificationType] || '🔔 New Notification';
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
