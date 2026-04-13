/**
 * NotificationService - Handle browser push notifications for prayer times
 * Uses the Web Notifications API with scheduling
 */

import { CalculatedPrayerTimes } from './PrayerTimesService';

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
}

export interface NotificationTiming {
    enabled: boolean;
    timing: 'atTime' | 'before5' | 'before10' | 'before15' | 'before30';
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

// =================== CONSTANTS ===================

const STORAGE_KEY = 'khalil_notification_settings';

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
};

// =================== SERVICE CLASS ===================

class NotificationService {
    private scheduledTimeouts: Map<string, number> = new Map();
    private settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;

    constructor() {
        this.loadSettings();
    }

    /**
     * Check if notifications are supported
     */
    isSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): NotificationPermissionStatus {
        if (!this.isSupported()) {
            return 'unsupported';
        }
        return Notification.permission as NotificationPermissionStatus;
    }

    /**
     * Request notification permission from user
     */
    async requestPermission(): Promise<NotificationPermissionStatus> {
        if (!this.isSupported()) {
            return 'unsupported';
        }

        try {
            const result = await Notification.requestPermission();
            return result as NotificationPermissionStatus;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    /**
     * Show a notification immediately
     */
    show(title: string, options?: NotificationOptions): Notification | null {
        if (!this.isSupported() || Notification.permission !== 'granted') {
            console.warn('Notifications not available or permission not granted');
            return null;
        }

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico', // Use app icon
                badge: '/favicon.ico',
                requireInteraction: true, // Keep notification until user interacts
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
     * Schedule a notification for a future time
     */
    schedule(
        id: string,
        title: string,
        body: string,
        scheduledTime: Date
    ): void {
        // Cancel any existing notification with this ID
        this.cancel(id);

        const now = new Date();
        const delay = scheduledTime.getTime() - now.getTime();

        if (delay <= 0) {
            // Time has already passed
            return;
        }

        const timeoutId = window.setTimeout(() => {
            this.show(title, { body, tag: id });
            this.scheduledTimeouts.delete(id);
        }, delay);

        this.scheduledTimeouts.set(id, timeoutId);
    }

    /**
     * Cancel a scheduled notification
     */
    cancel(id: string): void {
        const timeoutId = this.scheduledTimeouts.get(id);
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            this.scheduledTimeouts.delete(id);
        }
    }

    /**
     * Cancel all scheduled notifications
     */
    cancelAll(): void {
        this.scheduledTimeouts.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        this.scheduledTimeouts.clear();
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

        const notification = this.show('Test Notification', {
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
                this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load notification settings:', e);
        }
        return this.settings;
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
}

// Export singleton instance
export const notificationService = new NotificationService();
