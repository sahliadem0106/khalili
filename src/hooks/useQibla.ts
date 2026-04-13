/**
 * useQibla - React hook for Qibla direction using device compass
 */

import { useState, useEffect, useCallback } from 'react';
import { locationService, UserLocation } from '../services/LocationService';

interface UseQiblaReturn {
    // Qibla data
    qiblaDirection: number; // Degrees from North (0-360)
    deviceHeading: number | null; // Current device heading
    needleRotation: number; // Rotation for compass needle (qibla - heading)

    // Location
    location: UserLocation | null;
    distanceToKaaba: number | null; // km

    // Status
    isSupported: boolean;
    isCalibrating: boolean;
    error: string | null;
    permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';

    // Actions
    requestPermission: () => Promise<boolean>;
    startCompass: () => void;
    stopCompass: () => void;
}

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

export function useQibla(): UseQiblaReturn {
    const [qiblaDirection, setQiblaDirection] = useState<number>(0);
    const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [distanceToKaaba, setDistanceToKaaba] = useState<number | null>(null);
    const [isCalibrating, setIsCalibrating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
    const [isListening, setIsListening] = useState(false);

    // Check if DeviceOrientation is supported
    const isSupported = typeof window !== 'undefined' &&
        ('DeviceOrientationEvent' in window || 'ondeviceorientation' in window);

    // Load saved location
    useEffect(() => {
        const savedLocation = locationService.loadLocation();
        if (savedLocation) {
            setLocation(savedLocation);

            // Calculate Qibla direction
            const qibla = locationService.calculateQiblaDirection(
                savedLocation.latitude,
                savedLocation.longitude
            );
            setQiblaDirection(qibla);

            // Calculate distance to Kaaba
            const distance = locationService.calculateDistance(
                savedLocation.latitude,
                savedLocation.longitude,
                KAABA_LAT,
                KAABA_LON
            );
            setDistanceToKaaba(Math.round(distance));
        }
    }, []);

    // Handle device orientation event
    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        // Get compass heading
        // On iOS, webkitCompassHeading is available
        // On Android, use alpha value
        let heading: number | null = null;

        if ('webkitCompassHeading' in event) {
            // iOS
            heading = (event as any).webkitCompassHeading;
        } else if (event.alpha !== null) {
            // Android - alpha is the compass direction the device is facing
            // Needs to be converted: alpha is counter-clockwise from North
            heading = 360 - event.alpha;
        }

        if (heading !== null) {
            setDeviceHeading(heading);
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
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
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
        ? qiblaDirection - deviceHeading
        : qiblaDirection;

    return {
        qiblaDirection,
        deviceHeading,
        needleRotation,
        location,
        distanceToKaaba,
        isSupported,
        isCalibrating: isListening && isCalibrating,
        error,
        permissionStatus,
        requestPermission,
        startCompass,
        stopCompass,
    };
}
