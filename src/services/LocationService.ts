/**
 * LocationService - Handle geolocation and city search
 * Uses browser Geolocation API and reverse geocoding
 */

import { UserLocation } from './PrayerTimesService';
import { Geolocation as NativeGeolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Re-export UserLocation so other modules can import from here
export type { UserLocation };
// =================== TYPES ===================

export interface GeocodingResult {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
}

export interface LocationError {
    code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
    message: string;
}

// =================== CONSTANTS ===================

const STORAGE_KEY = 'khalil_location';

// Popular cities for quick selection (pre-defined with accurate coordinates)
export const POPULAR_CITIES: GeocodingResult[] = [
    { city: 'Makkah', country: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
    { city: 'Madinah', country: 'Saudi Arabia', latitude: 24.4672, longitude: 39.6024, timezone: 'Asia/Riyadh' },
    { city: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
    { city: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
    { city: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
    { city: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
    { city: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
    { city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
    { city: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
    { city: 'Los Angeles', country: 'USA', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
    { city: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
    { city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
    { city: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
    { city: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
    { city: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi' },
    { city: 'Dhaka', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka' },
    { city: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
    { city: 'Delhi', country: 'India', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata' },
    { city: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' },
    { city: 'Jeddah', country: 'Saudi Arabia', latitude: 21.4858, longitude: 39.1925, timezone: 'Asia/Riyadh' },
];

// =================== SERVICE CLASS ===================
class LocationService {
    /**
     * Get current position using browser Geolocation API
     */
    async getCurrentPosition(): Promise<UserLocation> {
        // Native Implementation
        if (Capacitor.isNativePlatform()) {
            try {
                const position = await NativeGeolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                });

                const { latitude, longitude } = position.coords;
                // Get city name via reverse geocoding
                const geocoded = await this.reverseGeocode(latitude, longitude);

                const location: UserLocation = {
                    latitude,
                    longitude,
                    city: geocoded?.city || 'Unknown',
                    country: geocoded?.country || 'Unknown',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    source: 'gps',
                };
                this.saveLocation(location);
                return location;
            } catch (error: any) {
                console.error("Native Geolocation Error:", error);
                throw {
                    code: 'PERMISSION_DENIED',
                    message: error.message || 'Location permission denied',
                } as LocationError;
            }
        }

        // Web Implementation
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject({
                    code: 'POSITION_UNAVAILABLE',
                    message: 'Geolocation is not supported by this browser',
                } as LocationError);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;

                        // Get city name via reverse geocoding
                        const geocoded = await this.reverseGeocode(latitude, longitude);

                        const location: UserLocation = {
                            latitude,
                            longitude,
                            city: geocoded?.city || 'Unknown',
                            country: geocoded?.country || 'Unknown',
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            source: 'gps',
                        };

                        // Save to localStorage
                        this.saveLocation(location);

                        resolve(location);
                    } catch (error) {
                        // Return with coords even if geocoding fails
                        const location: UserLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            source: 'gps',
                        };
                        this.saveLocation(location);
                        resolve(location);
                    }
                },
                (error) => {
                    let code: LocationError['code'];
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            code = 'PERMISSION_DENIED';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            code = 'POSITION_UNAVAILABLE';
                            break;
                        case error.TIMEOUT:
                            code = 'TIMEOUT';
                            break;
                        default:
                            code = 'UNKNOWN';
                    }
                    reject({ code, message: error.message } as LocationError);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes cache
                }
            );
        });
    }

    /**
     * Reverse geocode coordinates to get city name
     * Uses free Nominatim API (OpenStreetMap)
     */
    async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'Khalil-Islamic-App/1.0',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding request failed');
            }

            const data = await response.json();

            return {
                city: data.address?.city || data.address?.town || data.address?.municipality || data.address?.county || 'Unknown',
                country: data.address?.country || 'Unknown',
                latitude,
                longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return null;
        }
    }

    /**
     * Search for cities by name
     * Uses free Nominatim API (OpenStreetMap)
     */
    async searchCities(query: string): Promise<GeocodingResult[]> {
        if (!query || query.length < 2) {
            return [];
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&featuretype=city`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'Khalil-Islamic-App/1.0',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('City search request failed');
            }

            const data = await response.json();

            return data.map((item: any) => ({
                city: item.name || item.display_name.split(',')[0],
                country: item.display_name.split(',').pop()?.trim() || 'Unknown',
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Will update after selection
            }));
        } catch (error) {
            console.error('City search failed:', error);
            return [];
        }
    }

    /**
     * Get timezone for coordinates using browser's built-in timezone
     * For more accuracy, would need a timezone API
     */
    getTimezone(_latitude: number, _longitude: number): string {
        // For simplicity, use browser's timezone
        // In production, use a timezone API like Google Time Zone API
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Create UserLocation from GeocodingResult
     */
    createLocationFromResult(result: GeocodingResult, source: 'manual' | 'gps' = 'manual'): UserLocation {
        const location: UserLocation = {
            latitude: result.latitude,
            longitude: result.longitude,
            city: result.city,
            country: result.country,
            timezone: result.timezone,
            source,
        };

        this.saveLocation(location);
        return location;
    }

    /**
     * Save location to localStorage
     */
    saveLocation(location: UserLocation): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
        } catch (e) {
            console.error('Failed to save location:', e);
        }
    }

    /**
     * Load location from localStorage
     */
    loadLocation(): UserLocation | null {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load location:', e);
        }
        return null;
    }

    /**
     * Clear saved location
     */
    clearLocation(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear location:', e);
        }
    }

    /**
     * Check if geolocation is supported
     */
    isGeolocationSupported(): boolean {
        return 'geolocation' in navigator;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * Returns distance in kilometers
     */
    calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Calculate Qibla direction from given location
     * Returns bearing in degrees from North (0-360)
     */
    calculateQiblaDirection(latitude: number, longitude: number): number {
        // Kaaba coordinates
        const kaabaLat = 21.4225;
        const kaabaLon = 39.8262;

        const lat1 = this.toRadians(latitude);
        const lat2 = this.toRadians(kaabaLat);
        const dLon = this.toRadians(kaabaLon - longitude);

        const x = Math.sin(dLon) * Math.cos(lat2);
        const y = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

        let bearing = Math.atan2(x, y);
        bearing = bearing * (180 / Math.PI); // Convert to degrees
        bearing = (bearing + 360) % 360; // Normalize to 0-360

        return bearing;
    }
}

// Export singleton instance
export const locationService = new LocationService();
