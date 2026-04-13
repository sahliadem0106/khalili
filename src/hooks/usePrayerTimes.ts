/**
 * usePrayerTimes - React hook for prayer times with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import {
    prayerTimesService,
    CalculatedPrayerTimes,
    PrayerTimesSettings,
    DEFAULT_PRAYER_SETTINGS,
    HijriDate,
} from '../services/PrayerTimesService';
import { locationService, UserLocation } from '../services/LocationService';
import { notificationService } from '../services/NotificationService';

interface UsePrayerTimesReturn {
    // Prayer times data
    prayerTimes: CalculatedPrayerTimes | null;
    hijriDate: HijriDate | null;
    nextPrayer: {
        name: string;
        time: Date;
        remaining: number;
        formattedRemaining: string;
    } | null;

    // Location data
    location: UserLocation | null;
    locationLoading: boolean;
    locationError: string | null;

    // Settings
    settings: PrayerTimesSettings;
    updateSettings: (settings: Partial<PrayerTimesSettings>) => void;

    // Actions
    refreshLocation: () => Promise<void>;
    setManualLocation: (lat: number, lng: number, city?: string, country?: string) => void;

    // Status
    isLoading: boolean;
}

export function usePrayerTimes(): UsePrayerTimesReturn {
    const [prayerTimes, setPrayerTimes] = useState<CalculatedPrayerTimes | null>(null);
    const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [settings, setSettings] = useState<PrayerTimesSettings>(DEFAULT_PRAYER_SETTINGS);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved data on mount
    useEffect(() => {
        const savedLocation = locationService.loadLocation();
        const savedSettings = prayerTimesService.loadSettings();

        if (savedLocation) {
            setLocation(savedLocation);
        }
        setSettings(savedSettings);
        setIsLoading(false);
    }, []);

    // Calculate prayer times when location or settings change
    useEffect(() => {
        if (!location) {
            setPrayerTimes(null);
            return;
        }

        try {
            // Clear cache if settings changed
            prayerTimesService.clearCache();

            // Calculate times
            const times = prayerTimesService.getTodaysTimes(location, settings);
            setPrayerTimes(times);

            // Get Hijri date
            const hijri = prayerTimesService.toHijriDate(new Date());
            setHijriDate(hijri);

            // Schedule notifications
            const notifSettings = notificationService.getSettings();
            if (notifSettings.enabled && notificationService.getPermissionStatus() === 'granted') {
                notificationService.schedulePrayerNotifications(times);
            }

            // Start real-time countdown updates
            prayerTimesService.startCountdown(location, settings);

            // Subscribe to updates
            const unsubscribe = prayerTimesService.subscribe((updatedTimes) => {
                setPrayerTimes(updatedTimes);
            });

            return () => {
                unsubscribe();
                prayerTimesService.stopCountdown();
            };
        } catch (error) {
            console.error('Error calculating prayer times:', error);
            setPrayerTimes(null);
        }
    }, [location, settings]);

    // Refresh location from GPS
    const refreshLocation = useCallback(async () => {
        setLocationLoading(true);
        setLocationError(null);

        try {
            const newLocation = await locationService.getCurrentPosition();
            setLocation(newLocation);
        } catch (error: any) {
            setLocationError(error.message || 'Failed to get location');
        } finally {
            setLocationLoading(false);
        }
    }, []);

    // Set manual location
    const setManualLocation = useCallback((
        lat: number,
        lng: number,
        city?: string,
        country?: string
    ) => {
        const newLocation: UserLocation = {
            latitude: lat,
            longitude: lng,
            city,
            country,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            source: 'manual',
        };

        locationService.saveLocation(newLocation);
        setLocation(newLocation);
        setLocationError(null);
    }, []);

    // Update settings
    const updateSettings = useCallback((newSettings: Partial<PrayerTimesSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        prayerTimesService.saveSettings(updated);
    }, [settings]);

    // Computed next prayer with formatted time
    const nextPrayer = prayerTimes?.nextPrayer ? {
        ...prayerTimes.nextPrayer,
        formattedRemaining: prayerTimesService.formatCountdown(prayerTimes.nextPrayer.remaining),
    } : null;

    return {
        prayerTimes,
        hijriDate,
        nextPrayer,
        location,
        locationLoading,
        locationError,
        settings,
        updateSettings,
        refreshLocation,
        setManualLocation,
        isLoading,
    };
}
