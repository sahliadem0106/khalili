
import React, { useEffect, useState, useCallback } from 'react';
import { X, Compass, MapPin, Navigation, Smartphone, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

interface QiblaFinderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

// Coordinates of the Kaaba
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export const QiblaFinder: React.FC<QiblaFinderProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  
  // State
  const [heading, setHeading] = useState<number>(0); // Phone's current heading (0-360)
  const [qiblaBearing, setQiblaBearing] = useState<number>(0); // Target bearing to Kaaba
  const [calibrationStep, setCalibrationStep] = useState<'permission' | 'calibrating' | 'active'>('permission');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // 1. Calculate Bearing between two coords
  const calculateQibla = (lat: number, lng: number) => {
    const phiK = (KAABA_LAT * Math.PI) / 180.0;
    const lambdaK = (KAABA_LNG * Math.PI) / 180.0;
    const phi = (lat * Math.PI) / 180.0;
    const lambda = (lng * Math.PI) / 180.0;

    const y = Math.sin(lambdaK - lambda);
    const x =
      Math.cos(phi) * Math.sin(phiK) -
      Math.sin(phi) * Math.cos(phiK) * Math.cos(lambdaK - lambda);
    let bearing = (Math.atan2(y, x) * 180.0) / Math.PI;
    
    return (bearing + 360) % 360;
  };

  // 2. Initialize GPS
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const bearing = calculateQibla(latitude, longitude);
          setQiblaBearing(bearing);
          
          // Check permission status implicitly
          if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
             setCalibrationStep('calibrating');
             setTimeout(() => setCalibrationStep('active'), 1500);
          }
        },
        (err) => {
          console.error(err);
          setLocationError("Could not get location. Ensure GPS is on.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 3. Sensor Handling
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const event = e as DeviceOrientationEventiOS;
    let compass = 0;
    
    if (event.webkitCompassHeading) {
      // iOS
      compass = event.webkitCompassHeading;
    } else if (e.alpha) {
      // Android (approximate if absolute not available)
      compass = Math.abs(360 - e.alpha);
    }

    setHeading(compass);
  }, []);

  // Check alignment
  useEffect(() => {
    const diff = Math.abs(heading - qiblaBearing);
    // Allow a wider tolerance for easier alignment
    const isClose = diff < 10 || diff > 350; 
    
    if (isClose && !isAligned) {
      if (navigator.vibrate) navigator.vibrate(50);
      setIsAligned(true);
    } else if (!isClose && isAligned) {
      setIsAligned(false);
    }
  }, [heading, qiblaBearing, isAligned]);

  const requestAccess = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          setCalibrationStep('calibrating');
          setTimeout(() => setCalibrationStep('active'), 2000);
        } else {
          alert("Permission to use compass was denied.");
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // Android/Non-iOS
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
      setCalibrationStep('calibrating');
      setTimeout(() => setCalibrationStep('active'), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full h-full sm:max-w-md sm:h-[90vh] sm:rounded-3xl relative flex flex-col text-neutral-800 overflow-hidden bg-white">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="bg-brand-mint p-2 rounded-full">
              <Compass size={20} className="text-brand-forest" />
            </div>
            <span className="font-bold text-lg text-brand-forest">{t('qibla_finder')}</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
          >
            <X size={20} className="text-neutral-600" />
          </button>
        </div>

        {/* --- STATES --- */}

        {locationError ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <AlertTriangle size={48} className="text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-neutral-800">GPS Required</h3>
              <p className="text-neutral-500 mb-6">{locationError}</p>
              <Button onClick={onClose}>Close</Button>
           </div>
        ) : calibrationStep === 'permission' ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-32 h-32 bg-brand-mint rounded-full flex items-center justify-center animate-pulse">
                 <Smartphone size={64} className="text-brand-forest" />
              </div>
              <div>
                 <h3 className="text-2xl font-bold mb-2 text-neutral-800">Calibrate Compass</h3>
                 <p className="text-neutral-500 text-sm">We need access to your device sensors to calculate the precise direction of the Kaaba.</p>
              </div>
              <Button size="lg" onClick={requestAccess} className="w-full max-w-xs">
                 Start Calibration
              </Button>
           </div>
        ) : calibrationStep === 'calibrating' ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="relative w-48 h-48 mb-8">
                 {/* Figure 8 Animation */}
                 <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_3s_linear_infinite] text-brand-forest">
                    <path d="M50 50 C 20 50 20 20 50 20 C 80 20 80 50 50 50 C 20 50 20 80 50 80 C 80 80 80 50 50 50" 
                          fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
                 </svg>
                 <Smartphone size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-neutral-800">Tilt your phone</h3>
              <p className="text-neutral-500 text-sm">Wave your device in a figure-8 motion to calibrate.</p>
           </div>
        ) : (
           /* --- ACTIVE COMPASS (White Theme) --- */
           <div className="flex-1 flex flex-col items-center justify-center relative bg-white">
              
              {/* Background Grid */}
              <div className="absolute inset-0 pointer-events-none opacity-5" 
                   style={{ backgroundImage: 'radial-gradient(circle, #0F6B4A 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              </div>

              {/* Top Info */}
              <div className="absolute top-24 text-center z-10">
                 <div className={`text-5xl font-mono font-bold tracking-tighter transition-colors duration-300 ${isAligned ? 'text-brand-forest' : 'text-neutral-800'}`}>
                    {Math.round(heading)}°
                 </div>
                 <div className="flex items-center justify-center space-x-1 mt-1">
                    <span className="text-xs uppercase tracking-widest text-neutral-400">Qibla is {Math.round(qiblaBearing)}°</span>
                    {isAligned && <span className="bg-brand-forest text-[9px] px-1.5 rounded font-bold text-white">ALIGNED</span>}
                 </div>
              </div>

              {/* MAIN COMPASS DIAL */}
              <div 
                 className="relative w-72 h-72 sm:w-80 sm:h-80 transition-transform duration-300 ease-out will-change-transform"
                 style={{ transform: `rotate(${-heading}deg)` }}
              >
                 {/* 1. Outer Ring */}
                 <div className="absolute inset-0 rounded-full border-[3px] border-neutral-200 bg-white shadow-2xl"></div>
                 
                 {/* 2. Degree Marks */}
                 {Array.from({ length: 72 }).map((_, i) => (
                    <div 
                       key={i} 
                       className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] ${i % 18 === 0 ? 'bg-neutral-800' : 'bg-neutral-300'}`}
                       style={{ transform: `rotate(${i * 5}deg)` }}
                    >
                       <div className={`w-full ${i % 18 === 0 ? 'h-5' : 'h-2'}`}></div>
                    </div>
                 ))}

                 {/* 3. Cardinal Directions */}
                 {['N', 'E', 'S', 'W'].map((dir, i) => (
                    <div 
                       key={dir}
                       className="absolute top-6 left-1/2 -translate-x-1/2 text-lg font-bold"
                       style={{ transform: `rotate(${i * 90}deg) translateY(5px)` }}
                    >
                       <span style={{ transform: `rotate(${-i * 90}deg)` }} className={`block ${dir === 'N' ? 'text-red-500' : 'text-neutral-600'}`}>
                          {dir}
                       </span>
                    </div>
                 ))}

                 {/* 4. KAABA INDICATOR (Fixed on dial) */}
                 <div 
                    className="absolute top-0 left-1/2 w-12 h-1/2 -translate-x-1/2 origin-bottom z-20"
                    style={{ transform: `rotate(${qiblaBearing}deg)` }}
                 >
                    {/* The Green Line */}
                    <div className={`w-1 h-full mx-auto bg-gradient-to-t from-transparent via-brand-forest to-brand-forest transition-all ${isAligned ? 'opacity-100 w-1.5' : 'opacity-60'}`}></div>
                    
                    {/* The Kaaba Icon */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2">
                       <div className={`
                          relative flex items-center justify-center w-10 h-10 rounded-lg 
                          transition-all duration-500 bg-white border border-neutral-200 shadow-md
                          ${isAligned ? 'scale-125 border-brand-forest' : 'scale-100'}
                       `}>
                          {/* Simple Kaaba Graphic */}
                          <div className="w-5 h-6 bg-black rounded-[1px] relative">
                             <div className="absolute top-1 left-0 right-0 h-[1px] bg-yellow-400"></div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* 5. North Triangle (Red) */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1.5">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-red-500"></div>
                 </div>

              </div>

              {/* Center Fixed Phone Reference */}
              <div className="absolute w-full h-full flex items-center justify-center pointer-events-none z-30">
                 {/* Crosshair */}
                 <div className="w-64 h-64 border border-neutral-200/50 rounded-full flex items-center justify-center">
                    <div className="w-1 bg-neutral-200/50 h-4 absolute top-0"></div>
                    <div className="w-1 bg-neutral-200/50 h-4 absolute bottom-0"></div>
                    <div className="h-1 bg-neutral-200/50 w-4 absolute left-0"></div>
                    <div className="h-1 bg-neutral-200/50 w-4 absolute right-0"></div>
                 </div>
                 
                 {/* Center Dot */}
                 <div className="absolute w-3 h-3 bg-brand-forest rounded-full shadow-sm ring-4 ring-brand-mint/50"></div>
                 
                 {/* Current Heading Arrow (Fixed Top) */}
                 <div className="absolute top-[22%] -translate-y-1/2">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-neutral-800/20"></div>
                 </div>
              </div>

              {/* Footer Info */}
              <div className="absolute bottom-8 w-full px-6">
                 <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                       <div className="w-10 h-10 bg-brand-mint rounded-full flex items-center justify-center">
                          <MapPin size={20} className="text-brand-forest" />
                       </div>
                       <div>
                          <p className="text-xs text-neutral-400">My Coordinates</p>
                          <p className="text-sm font-mono font-bold text-neutral-800">
                             {userLocation 
                                ? `${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}` 
                                : 'Locating...'}
                          </p>
                       </div>
                    </div>
                    {isAligned && (
                       <div className="flex items-center text-brand-forest text-xs font-bold">
                          <Check size={16} className="me-1" /> Perfect
                       </div>
                    )}
                 </div>
              </div>

           </div>
        )}
      </div>
    </div>
  );
};

// Helper for icon
import { Check } from 'lucide-react';
