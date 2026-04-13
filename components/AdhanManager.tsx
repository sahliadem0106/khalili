/**
 * AdhanManager - Renderless component that monitors prayer times and triggers Adhan
 */

import { useEffect, useRef } from 'react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useAdhan } from '../contexts/AdhanContext';

// Prayer name mappings
const PRAYER_NAMES: Record<string, { en: string; ar: string }> = {
    fajr: { en: 'Fajr', ar: 'الفجر' },
    dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
    asr: { en: 'Asr', ar: 'العصر' },
    maghrib: { en: 'Maghrib', ar: 'المغرب' },
    isha: { en: 'Isha', ar: 'العشاء' },
};

// Check if now is within ±30 seconds of the target time
const isWithinWindow = (target: Date, windowSeconds: number = 30): boolean => {
    const now = new Date();
    const diff = Math.abs(now.getTime() - target.getTime());
    return diff <= windowSeconds * 1000;
};

export const AdhanManager: React.FC = () => {
    const { prayerTimes } = usePrayerTimes();
    const { triggerAdhan } = useAdhan();
    const lastCheckedRef = useRef<string>('');

    useEffect(() => {
        if (!prayerTimes) return;

        // Check every 10 seconds
        const checkInterval = setInterval(() => {
            const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
            const now = new Date();

            for (const prayerKey of prayers) {
                const prayerTime = prayerTimes[prayerKey];
                if (!prayerTime || !(prayerTime instanceof Date)) continue;

                // Check if within the trigger window
                if (isWithinWindow(prayerTime, 30)) {
                    // Create a unique key for this prayer instance
                    const checkKey = `${prayerKey}-${prayerTime.toISOString()}`;

                    // Avoid triggering multiple times in the same window
                    if (lastCheckedRef.current === checkKey) {
                        continue;
                    }

                    lastCheckedRef.current = checkKey;

                    const names = PRAYER_NAMES[prayerKey];
                    console.log(`[AdhanManager] Prayer time detected: ${names.en} at ${prayerTime.toLocaleTimeString()}`);
                    triggerAdhan(names.en, names.ar);
                    break; // Only trigger one prayer at a time
                }
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(checkInterval);
    }, [prayerTimes, triggerAdhan]);

    // This is a renderless component
    return null;
};
