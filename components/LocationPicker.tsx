/**
 * LocationPicker - Modal for selecting user location
 * Supports GPS detection and manual city search
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Search, Navigation, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { locationService, POPULAR_CITIES, GeocodingResult } from '../services/LocationService';
import { UserLocation } from '../services/PrayerTimesService';
import { useLanguage } from '../contexts/LanguageContext';

interface LocationPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationSelect: (location: UserLocation) => void;
    currentLocation: UserLocation | null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
    isOpen,
    onClose,
    onLocationSelect,
    currentLocation,
}) => {
    const { t, dir } = useLanguage();
    const [mode, setMode] = useState<'gps' | 'search'>('gps');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<GeocodingResult | null>(null);

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await locationService.searchCities(searchQuery);
                setSearchResults(results);
            } catch (e) {
                console.error('Search failed:', e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle GPS detection
    const handleDetectLocation = useCallback(async () => {
        setError(null);
        setIsDetecting(true);

        try {
            const location = await locationService.getCurrentPosition();
            onLocationSelect(location);
            onClose();
        } catch (e: any) {
            if (e.code === 'PERMISSION_DENIED') {
                setError('Location permission denied. Please enable location access in your browser settings.');
            } else {
                setError(e.message || 'Failed to detect location');
            }
        } finally {
            setIsDetecting(false);
        }
    }, [onLocationSelect, onClose]);

    // Handle city selection
    const handleCitySelect = useCallback((city: GeocodingResult) => {
        setSelectedCity(city);
    }, []);

    // Confirm selection
    const handleConfirm = useCallback(() => {
        if (selectedCity) {
            const location = locationService.createLocationFromResult(selectedCity, 'manual');
            onLocationSelect(location);
            onClose();
        }
    }, [selectedCity, onLocationSelect, onClose]);

    // Handle popular city selection
    const handlePopularCitySelect = useCallback((city: GeocodingResult) => {
        const location = locationService.createLocationFromResult(city, 'manual');
        onLocationSelect(location);
        onClose();
    }, [onLocationSelect, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className="bg-brand-surface w-full max-h-[90vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-glass border border-white/10 animate-in slide-in-from-bottom duration-300 relative z-10 flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <div className="bg-brand-primary/10 p-2 rounded-full">
                            <MapPin size={18} className="text-brand-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900">{t('location_title')}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-neutral-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Current Location Display */}
                {currentLocation && (
                    <div className="px-6 py-3 bg-brand-primary/10 border-b border-brand-primary/20">
                        <p className="text-sm text-brand-primary flex items-center">
                            <Check size={16} className="me-2" />
                            {t('location_current')}: <span className="font-bold ms-1">{currentLocation.city || 'Unknown'}, {currentLocation.country || ''}</span>
                        </p>
                    </div>
                )}

                {/* Mode Toggle */}
                <div className="px-6 py-4">
                    <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setMode('gps')}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center ${mode === 'gps'
                                ? 'bg-brand-surface shadow-sm text-brand-primary'
                                : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                        >
                            <Navigation size={16} className="me-2" />
                            {t('location_detect_gps')}
                        </button>
                        <button
                            onClick={() => setMode('search')}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center ${mode === 'search'
                                ? 'bg-brand-surface shadow-sm text-brand-primary'
                                : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                        >
                            <Search size={16} className="me-2" />
                            {t('location_search_city')}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {mode === 'gps' ? (
                        <div className="space-y-4">
                            {/* GPS Button */}
                            <Button
                                fullWidth
                                onClick={handleDetectLocation}
                                disabled={isDetecting}
                                className="h-14 bg-brand-primary hover:bg-brand-primary/90 text-white"
                            >
                                {isDetecting ? (
                                    <>
                                        <Loader2 size={18} className="me-2 animate-spin" />
                                        {t('location_detecting')}
                                    </>
                                ) : (
                                    <>
                                        <Navigation size={18} className="me-2" />
                                        {t('location_use_current')}
                                    </>
                                )}
                            </Button>

                            {/* Error Display */}
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2 rtl:space-x-reverse">
                                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            {/* Popular Cities */}
                            <div>
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                                    {t('location_popular')}
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {POPULAR_CITIES.slice(0, 8).map((city) => (
                                        <button
                                            key={`${city.city}-${city.country}`}
                                            onClick={() => handlePopularCitySelect(city)}
                                            className="p-3 text-start bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                                        >
                                            <p className="font-semibold text-sm text-white truncate">{city.city}</p>
                                            <p className="text-xs text-neutral-400 truncate">{city.country}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search
                                    size={18}
                                    className={`absolute top-1/2 -translate-y-1/2 text-neutral-500 ${dir === 'rtl' ? 'right-3' : 'left-3'
                                        }`}
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('location_search_placeholder') as string}
                                    className={`w-full py-3 rounded-xl bg-black/20 border border-white/10 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary/50 transition-all text-sm text-white placeholder-neutral-500 outline-none ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'
                                        }`}
                                    autoFocus
                                />
                                {isSearching && (
                                    <Loader2
                                        size={18}
                                        className={`absolute top-1/2 -translate-y-1/2 text-brand-primary animate-spin ${dir === 'rtl' ? 'left-3' : 'right-3'
                                            }`}
                                    />
                                )}
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="space-y-2">
                                    {searchResults.map((city, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleCitySelect(city)}
                                            className={`w-full p-4 text-start rounded-xl border transition-all ${selectedCity === city
                                                ? 'border-brand-primary bg-brand-primary/10'
                                                : 'border-white/5 bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-white">{city.city}</p>
                                                    <p className="text-xs text-neutral-400">{city.country}</p>
                                                </div>
                                                {selectedCity === city && (
                                                    <Check size={18} className="text-brand-primary" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Popular Cities when no search */}
                            {searchQuery.length === 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                                        {t('location_popular_cities')}
                                    </h4>
                                    <div className="space-y-2">
                                        {POPULAR_CITIES.slice(0, 10).map((city) => (
                                            <button
                                                key={`${city.city}-${city.country}`}
                                                onClick={() => handleCitySelect(city)}
                                                className={`w-full p-3 text-start rounded-xl border transition-all flex items-center justify-between ${selectedCity === city
                                                    ? 'border-brand-primary bg-brand-primary/10'
                                                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-semibold text-sm text-white">{city.city}</p>
                                                    <p className="text-xs text-neutral-400">{city.country}</p>
                                                </div>
                                                {selectedCity === city && (
                                                    <Check size={16} className="text-brand-primary" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with Confirm Button (for search mode) */}
                {mode === 'search' && selectedCity && (
                    <div className="px-6 py-4 border-t border-white/10">
                        <Button fullWidth onClick={handleConfirm} className="bg-brand-primary text-white hover:bg-brand-primary/90">
                            {t('confirm')}: {selectedCity.city}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
