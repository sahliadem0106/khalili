/**
 * useQibla - React hook for Qibla direction using device compass
 * 
 * FIXES APPLIED:
 * 1. Auto-fetch GPS location if no saved location exists
 * 2. Low-pass filter for smooth compass movement
 * 3. Proper initialization and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// WebKit compass types (Safari/iOS)
interface WebKitDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}
import { locationService, UserLocation } from '../services/LocationService';

interface UseQiblaReturn {
    // Qibla data
    qiblaDirection: number; // Degrees from North (0-360)
    deviceHeading: number | null; // Current device heading (smoothed)
    needleRotation: number; // Rotation for compass needle (qibla - heading)

    // Location
    location: UserLocation | null;
    distanceToKaaba: number | null; // km

    // Status
    isSupported: boolean;
    isCalibrating: boolean;
    isLoadingLocation: boolean;
    error: string | null;
    permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';

    // Actions
    requestPermission: () => Promise<boolean>;
    startCompass: () => void;
    stopCompass: () => void;
    refreshLocation: () => Promise<void>;
}

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

// Smoothing factor for low-pass filter (0-1, lower = smoother but more lag)
const SMOOTHING_FACTOR = 0.15;

export function useQibla(): UseQiblaReturn {
    const [qiblaDirection, setQiblaDirection] = useState<number>(0);
    const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [distanceToKaaba, setDistanceToKaaba] = useState<number | null>(null);
    const [isCalibrating, setIsCalibrating] = useState(true);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
    const [isListening, setIsListening] = useState(false);

    // Ref for smoothed heading (to avoid dependency issues)
    const smoothedHeadingRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);
    // Guard against setState on unmounted component
    const isMountedRef = useRef(true);

    // Track mount/unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Check if DeviceOrientation is supported
    const isSupported = typeof window !== 'undefined' &&
        ('DeviceOrientationEvent' in window || 'ondeviceorientation' in window);

    // Calculate Qibla from location
    const updateQiblaFromLocation = useCallback((loc: UserLocation) => {
        const qibla = locationService.calculateQiblaDirection(
            loc.latitude,
            loc.longitude
        );
        setQiblaDirection(qibla);

        const distance = locationService.calculateDistance(
            loc.latitude,
            loc.longitude,
            KAABA_LAT,
            KAABA_LON
        );
        setDistanceToKaaba(Math.round(distance));
    }, []);

    // Fetch fresh GPS location
    const refreshLocation = useCallback(async () => {
        setIsLoadingLocation(true);
        setError(null);
        try {
            const loc = await locationService.getCurrentPosition();
            if (!isMountedRef.current) return; // Guard: component may have unmounted during await
            setLocation(loc);
            updateQiblaFromLocation(loc);
        } catch (err: any) {
            if (!isMountedRef.current) return; // Guard
            setError(err.message || 'Failed to get location');
            console.error('Location error:', err);
        } finally {
            if (isMountedRef.current) {
                setIsLoadingLocation(false);
            }
        }
    }, [updateQiblaFromLocation]);

    // Load saved location OR fetch new one
    useEffect(() => {
        const savedLocation = locationService.loadLocation();
        if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
            setLocation(savedLocation);
            updateQiblaFromLocation(savedLocation);
        } else {
            // No saved location - fetch GPS
            refreshLocation();
        }
    }, [updateQiblaFromLocation, refreshLocation]);

    // Handle device orientation event with SMOOTHING
    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        // Throttle updates to ~30 FPS max
        const now = Date.now();
        if (now - lastUpdateRef.current < 33) return; // Skip if less than 33ms since last update
        lastUpdateRef.current = now;

        let rawHeading: number | null = null;

        if ('webkitCompassHeading' in event) {
            // iOS - webkitCompassHeading is degrees from magnetic north
            rawHeading = (event as WebKitDeviceOrientationEvent).webkitCompassHeading;
        } else if (event.alpha !== null) {
            // Android - alpha is rotation around Z-axis
            // When facing north, alpha is 0. Alpha increases counter-clockwise.
            // So heading = (360 - alpha) % 360 gives us clockwise degrees from north
            rawHeading = (360 - event.alpha) % 360;
        }

        if (rawHeading !== null && !isNaN(rawHeading)) {
            // Apply low-pass filter for smoothing
            if (smoothedHeadingRef.current === null) {
                smoothedHeadingRef.current = rawHeading;
            } else {
                // Handle wrap-around at 0/360 degrees
                let diff = rawHeading - smoothedHeadingRef.current;
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;

                smoothedHeadingRef.current = (smoothedHeadingRef.current + diff * SMOOTHING_FACTOR + 360) % 360;
            }

            setDeviceHeading(Math.round(smoothedHeadingRef.current));
            setIsCalibrating(false);
            setError(null);
        }
    }, []);

    // Request permission for DeviceOrientation (required on iOS 13+)
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setPermissionStatus('unsupported');
            setError('Compass not supported on this device');
            return false;
        }

        // Check if permission API exists (iOS 13+)
        const DOEvent = DeviceOrientationEvent as unknown as DeviceOrientationEventStatic;
        if (typeof DOEvent.requestPermission === 'function') {
            try {
                const permission = await DOEvent.requestPermission();
                if (permission === 'granted') {
                    setPermissionStatus('granted');
                    return true;
                } else {
                    setPermissionStatus('denied');
                    setError('Compass permission denied');
                    return false;
                }
            } catch (e) {
                setError('Failed to request compass permission');
                setPermissionStatus('denied');
                return false;
            }
        } else {
            // Non-iOS or older iOS - permission not required
            setPermissionStatus('granted');
            return true;
        }
    }, [isSupported]);

    // Start listening to compass
    const startCompass = useCallback(() => {
        if (!isSupported) {
            setError('Compass not supported');
            return;
        }

        // Reset smoothing
        smoothedHeadingRef.current = null;

        if (permissionStatus !== 'granted') {
            requestPermission().then((granted) => {
                if (granted) {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    setIsListening(true);
                    setIsCalibrating(true);
                }
            });
        } else {
            window.addEventListener('deviceorientation', handleOrientation, true);
            setIsListening(true);
            setIsCalibrating(true);
        }
    }, [isSupported, permissionStatus, requestPermission, handleOrientation]);

    // Stop listening to compass
    const stopCompass = useCallback(() => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
        setIsListening(false);
        smoothedHeadingRef.current = null;
    }, [handleOrientation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isListening) {
                window.removeEventListener('deviceorientation', handleOrientation, true);
            }
        };
    }, [isListening, handleOrientation]);

    // Calculate needle rotation (how much to rotate the compass needle to point to Qibla)
    const needleRotation = deviceHeading !== null
        ? (qiblaDirection - deviceHeading + 360) % 360
        : qiblaDirection;

    return {
        qiblaDirection,
        deviceHeading,
        needleRotation,
        location,
        distanceToKaaba,
        isSupported,
        isCalibrating: isListening && isCalibrating,
        isLoadingLocation,
        error,
        permissionStatus,
        requestPermission,
        startCompass,
        stopCompass,
        refreshLocation,
    };
}
