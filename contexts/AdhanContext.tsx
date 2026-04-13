/**
 * AdhanContext - Global state for Adhan overlay management
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { audioService } from '../services/AudioService';
import { notificationService } from '../services/NotificationService';

interface AdhanState {
    isActive: boolean;
    prayerName: string;
    prayerNameAr: string;
    shouldPlaySound: boolean;
}

interface AdhanContextType {
    state: AdhanState;
    triggerAdhan: (prayerName: string, prayerNameAr: string) => void;
    triggerTestAdhan: () => void; // For testing purposes
    dismissAdhan: () => void;
}

const AdhanContext = createContext<AdhanContextType | undefined>(undefined);

const LAST_TRIGGERED_KEY = 'khalil_last_adhan_triggered';

// Check if this prayer was already triggered today
const wasAlreadyTriggered = (prayerName: string): boolean => {
    try {
        const stored = localStorage.getItem(LAST_TRIGGERED_KEY);
        if (!stored) return false;

        const data = JSON.parse(stored);
        const today = new Date().toDateString();

        return data.date === today && data.prayer === prayerName;
    } catch {
        return false;
    }
};

// Mark prayer as triggered today
const markAsTriggered = (prayerName: string): void => {
    const today = new Date().toDateString();
    localStorage.setItem(LAST_TRIGGERED_KEY, JSON.stringify({
        date: today,
        prayer: prayerName,
    }));
};

// Check if a specific prayer's notifications are enabled
const isPrayerNotificationEnabled = (prayerName: string): boolean => {
    const settings = notificationService.getSettings();
    const prayerKey = prayerName.toLowerCase() as keyof typeof settings.prayerNotifications;
    const prayerSetting = settings.prayerNotifications[prayerKey];
    return prayerSetting?.enabled !== false; // Default to true if not found
};

export const AdhanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AdhanState>({
        isActive: false,
        prayerName: '',
        prayerNameAr: '',
        shouldPlaySound: false,
    });

    const triggerAdhan = useCallback((prayerName: string, prayerNameAr: string) => {
        // Check if already triggered for this prayer today
        if (wasAlreadyTriggered(prayerName)) {
            console.log(`[AdhanContext] ${prayerName} already triggered today, skipping.`);
            return;
        }

        // Check user settings
        const settings = notificationService.getSettings();
        const overlayEnabled = settings.adhanOverlayEnabled !== false; // Default true
        const soundEnabled = settings.adhanSoundEnabled !== false; // Default true

        if (!overlayEnabled) {
            console.log('[AdhanContext] Adhan overlay disabled by user settings.');
            return;
        }

        // Check if this specific prayer's notifications are enabled
        if (!isPrayerNotificationEnabled(prayerName)) {
            console.log(`[AdhanContext] ${prayerName} notifications disabled, skipping overlay.`);
            return;
        }

        // Mark as triggered to prevent duplicates
        markAsTriggered(prayerName);

        // Show overlay with sound flag
        setState({
            isActive: true,
            prayerName,
            prayerNameAr,
            shouldPlaySound: soundEnabled,
        });

        console.log(`[AdhanContext] Adhan triggered for ${prayerName} (Sound: ${soundEnabled})`);
    }, []);

    // Test function that bypasses duplicate prevention
    const triggerTestAdhan = useCallback(() => {
        try {
            const settings = notificationService.getSettings();
            const soundEnabled = settings.adhanSoundEnabled !== false;

            setState({
                isActive: true,
                prayerName: 'Dhuhr',
                prayerNameAr: 'الظهر',
                shouldPlaySound: soundEnabled,
            });
        } catch (e) {
            console.error('[AdhanContext] Error in triggerTestAdhan:', e);
        }
    }, []);

    const dismissAdhan = useCallback(() => {
        audioService.stopAdhan();
        setState({
            isActive: false,
            prayerName: '',
            prayerNameAr: '',
            shouldPlaySound: false,
        });
        console.log('[AdhanContext] Adhan dismissed');
    }, []);

    return (
        <AdhanContext.Provider value={{ state, triggerAdhan, triggerTestAdhan, dismissAdhan }}>
            {children}
        </AdhanContext.Provider>
    );
};

export const useAdhan = (): AdhanContextType => {
    const context = useContext(AdhanContext);
    if (!context) {
        throw new Error('useAdhan must be used within an AdhanProvider');
    }
    return context;
};
