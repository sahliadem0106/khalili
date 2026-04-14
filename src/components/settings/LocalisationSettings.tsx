import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, RefreshCw, Globe, Navigation } from 'lucide-react';
import { locationService } from '../../services/LocationService';
import { UserLocation } from '../../services/PrayerTimesService';

interface LocalisationSettingsProps {
    onBack: () => void;
}

export const LocalisationSettings: React.FC<LocalisationSettingsProps> = ({ onBack }) => {
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLocation();
    }, []);

    const loadLocation = async () => {
        setLoading(true);
        setError(null);
        try {
            // Try to load saved location first
            const saved = locationService.loadLocation();
            if (saved) {
                setLocation(saved);
            } else {
                // Get current position
                const loc = await locationService.getCurrentPosition();
                setLocation(loc);
            }
        } catch (err) {
            setError('Failed to get location');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setError(null);
        try {
            const loc = await locationService.getCurrentPosition();
            locationService.saveLocation(loc);
            setLocation(loc);
        } catch (err) {
            setError('Failed to refresh location');
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-brand-surface dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-brand-primary/10 dark:border-gray-700">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10"
                >
                    <ArrowLeft size={24} className="rtl:rotate-180 text-neutral-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Location Settings</h2>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1">
                {/* Current Location Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                            <MapPin size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Your Location</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Used for prayer times</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-brand-primary text-white rounded-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : location ? (
                        <div className="space-y-4">
                            {/* City & Country */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                <Globe size={20} className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">City</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {location.city || 'Unknown City'}
                                    </p>
                                </div>
                            </div>

                            {/* Coordinates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Latitude</p>
                                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                        {location.latitude.toFixed(6)}°
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Longitude</p>
                                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                        {location.longitude.toFixed(6)}°
                                    </p>
                                </div>
                            </div>

                            {/* Timezone */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                <Navigation size={20} className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Timezone</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-brand-primary text-white rounded-xl font-semibold hover:bg-brand-primary/90 disabled:opacity-50 transition-all"
                >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Updating Location...' : 'Refresh My Location'}
                </button>

                {/* Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        📍 Your location is used to calculate accurate prayer times.
                        It's stored locally on your device and only shared with our prayer time service.
                    </p>
                </div>
            </div>
        </div>
    );
};
