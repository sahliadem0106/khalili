/**
 * QiblaFinder - Real compass with Qibla direction
 * Uses DeviceOrientation API for actual compass functionality
 */

import React, { useEffect } from 'react';
import { X, Navigation, AlertCircle, MapPin, Compass, RotateCcw, Check, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { useQibla } from '../hooks/useQibla';
import { useLanguage } from '../contexts/LanguageContext';

interface QiblaFinderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QiblaFinder: React.FC<QiblaFinderProps> = ({ isOpen, onClose }) => {
  const { t, language, dir } = useLanguage();
  const {
    qiblaDirection,
    deviceHeading,
    needleRotation,
    location,
    distanceToKaaba,
    isSupported,
    isCalibrating,
    isLoadingLocation,
    error,
    permissionStatus,
    requestPermission,
    startCompass,
    stopCompass,
    refreshLocation,
  } = useQibla();

  // Start compass when modal opens
  useEffect(() => {
    if (isOpen && isSupported) {
      startCompass();
    }
    return () => {
      stopCompass();
    };
  }, [isOpen, isSupported, startCompass, stopCompass]);

  // Check if we're aligned with Qibla (within 5 degrees)
  const isAligned = deviceHeading !== null &&
    (Math.abs(needleRotation) < 5 || Math.abs(needleRotation - 360) < 5 || Math.abs(needleRotation) > 355);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 animate-in fade-in duration-200">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-md px-6 text-center">
        {/* Header */}
        <h2 className="text-3xl font-bold text-white mb-2">
          {t('qibla_finder')}
        </h2>

        {/* Status Text */}
        <div className="mb-8">
          {isCalibrating ? (
            <p className="text-emerald-200 animate-pulse">
              {t('qibla_calibrating')}
            </p>
          ) : isAligned ? (
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-green-300">
              <Check size={20} />
              <p className="font-semibold">
                {t('qibla_aligned')}
              </p>
            </div>
          ) : deviceHeading !== null ? (
            <p className="text-emerald-200">
              {t('qibla_rotate_instruction')}
            </p>
          ) : (
            <p className="text-emerald-200">
              {t('qibla_loading')}
            </p>
          )}
        </div>

        {/* Compass Display */}
        <div className={`relative w-72 h-72 mx-auto mb-8 rounded-full transition-all duration-300 ${isAligned ? 'ring-4 ring-green-400 ring-offset-4 ring-offset-emerald-900 shadow-2xl shadow-green-500/50' : ''}`}>
          {/* Outer Ring with Degree Markers */}
          <div className="absolute inset-0 rounded-full border-4 border-white/20">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="absolute w-full h-full"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/40"></div>
                {deg % 90 === 0 && (
                  <span className="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-white/60 font-medium">
                    {deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : 'W'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Compass Dial (rotates with device) - KAABA IS ON THIS */}
          <div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 transition-transform duration-100 ease-out"
            style={{
              transform: deviceHeading !== null
                ? `rotate(${-deviceHeading}deg)`
                : 'rotate(0deg)'
            }}
          >
            {/* North Indicator on Dial */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
            </div>

            {/* Kaaba Icon - FIXED on dial at qiblaDirection (relative to North) */}
            <div
              className="absolute inset-4"
              style={{ transform: `rotate(${qiblaDirection}deg)` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${isAligned ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110' : 'bg-emerald-600/80'}`}>
                  🕋
                </div>
              </div>
            </div>
          </div>

          {/* User Direction Indicator - Points UP (your forward direction) */}
          <div className="absolute inset-8 pointer-events-none">
            {/* Triangle pointing up (your forward direction relative to dial) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
              <div className={`w-0 h-0 border-l-[12px] border-r-[12px] border-b-[30px] border-l-transparent border-r-transparent transition-colors ${isAligned ? 'border-b-green-400' : 'border-b-white/60'}`}></div>
            </div>
          </div>

          {/* Center Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-4 h-4 rounded-full shadow-lg transition-colors ${isAligned ? 'bg-green-400' : 'bg-white'}`}></div>
          </div>

          {/* "You" indicator at bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
            <div className="bg-white text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              {t('qibla_you')}
            </div>
          </div>
        </div>

        {/* Direction Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
          <div className="flex justify-around text-white">
            <div className="text-center">
              <p className="text-xs text-emerald-200 mb-1">
                {t('qibla_direction')}
              </p>
              <p className="text-2xl font-bold">{Math.round(qiblaDirection)}°</p>
            </div>
            {deviceHeading !== null && (
              <div className="text-center">
                <p className="text-xs text-emerald-200 mb-1">
                  {t('qibla_heading')}
                </p>
                <p className="text-2xl font-bold">{Math.round(deviceHeading)}°</p>
              </div>
            )}
            {distanceToKaaba && (
              <div className="text-center">
                <p className="text-xs text-emerald-200 mb-1">
                  {t('qibla_distance')}
                </p>
                <p className="text-2xl font-bold">{distanceToKaaba.toLocaleString()} km</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Display */}
        {location && (
          <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-emerald-200/80 text-sm mb-4">
            <MapPin size={14} />
            <span>{location.city || 'Unknown'}{location.country ? `, ${location.country}` : ''}</span>
          </div>
        )}

        {/* Error/Warning Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}

        {!isSupported && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                {t('qibla_unsupported_desc')}
              </p>
            </div>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <Info size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                {t('qibla_permission_desc')}
              </p>
            </div>
          </div>
        )}

        {/* Request Permission Button (for iOS) */}
        {permissionStatus === 'prompt' && isSupported && (
          <Button
            onClick={requestPermission}
            className="bg-white text-emerald-800 hover:bg-emerald-50"
          >
            <Compass size={18} className="me-2" />
            {t('enable_compass')}
          </Button>
        )}

        {/* Calibration Info */}
        <div className="text-center mt-4">
          <p className="text-xs text-emerald-200/60">
            {t('calibration_instruction')}
          </p>
        </div>
      </div>
    </div>
  );
};
