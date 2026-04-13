/**
 * useNotifications - React hook for managing notification permissions and settings
 */

import { useState, useEffect, useCallback } from 'react';
import {
    notificationService,
    NotificationSettings,
    DEFAULT_NOTIFICATION_SETTINGS,
    NotificationPermissionStatus
} from '../services/NotificationService';

interface UseNotificationsReturn {
    // Permission
    permissionStatus: NotificationPermissionStatus;
    requestPermission: () => Promise<NotificationPermissionStatus>;

    // Settings
    settings: NotificationSettings;
    updateSettings: (settings: Partial<NotificationSettings>) => void;
    updatePrayerNotification: (
        prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
        enabled: boolean,
        timing?: 'atTime' | 'before5' | 'before10' | 'before15' | 'before30'
    ) => void;

    // Actions
    sendTestNotification: () => Promise<boolean>;

    // Status
    isSupported: boolean;
}

export function useNotifications(): UseNotificationsReturn {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(
        notificationService.getPermissionStatus()
    );
    const [settings, setSettings] = useState<NotificationSettings>(
        notificationService.getSettings()
    );

    const isSupported = notificationService.isSupported();

    // Load settings on mount
    useEffect(() => {
        const loadedSettings = notificationService.loadSettings();
        setSettings(loadedSettings);
        setPermissionStatus(notificationService.getPermissionStatus());
    }, []);

    // Request permission
    const requestPermission = useCallback(async () => {
        const status = await notificationService.requestPermission();
        setPermissionStatus(status);
        return status;
    }, []);

    // Update all settings
    const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        notificationService.saveSettings(updated);
    }, [settings]);

    // Update individual prayer notification
    const updatePrayerNotification = useCallback((
        prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
        enabled: boolean,
        timing?: 'atTime' | 'before5' | 'before10' | 'before15' | 'before30'
    ) => {
        const updated = {
            ...settings,
            prayerNotifications: {
                ...settings.prayerNotifications,
                [prayer]: {
                    enabled,
                    timing: timing || settings.prayerNotifications[prayer].timing,
                },
            },
        };
        setSettings(updated);
        notificationService.saveSettings(updated);
    }, [settings]);

    // Send test notification
    const sendTestNotification = useCallback(async () => {
        return notificationService.sendTestNotification();
    }, []);

    return {
        permissionStatus,
        requestPermission,
        settings,
        updateSettings,
        updatePrayerNotification,
        sendTestNotification,
        isSupported,
    };
}
