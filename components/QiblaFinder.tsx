import React, { useEffect, useState } from 'react';
import { X, Compass, MapPin, Navigation } from 'lucide-react';
import { Button } from './ui/Button';

interface QiblaFinderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QiblaFinder: React.FC<QiblaFinderProps> = ({ isOpen, onClose }) => {
  const [heading, setHeading] = useState(0);
  const [calibrating, setCalibrating] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Simulate compass movement
      setCalibrating(true);
      const interval = setInterval(() => {
        // Random gentle fluctuation around the "Kaaba direction" (let's say 294 degrees)
        const baseQibla = 294;
        const fluctuation = (Math.random() * 10) - 5;
        setHeading(baseQibla + fluctuation);
      }, 100);

      const timeout = setTimeout(() => setCalibrating(false), 1500);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 w-full h-full sm:max-w-md sm:h-[90vh] sm:rounded-3xl p-6 relative flex flex-col text-white">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 z-10">
          <div className="flex items-center space-x-2">
            <div className="bg-white/10 p-2 rounded-full">
              <Compass size={20} className="text-brand-mint" />
            </div>
            <span className="font-bold text-lg">Qibla Finder</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Compass Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          
          {/* Degrees Display */}
          <div className="absolute top-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <span className="text-5xl font-mono font-bold tracking-tighter">{Math.round(heading)}°</span>
            <span className="text-brand-mint text-sm uppercase tracking-widest mt-1">NW</span>
          </div>

          {/* Compass Dial */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-2 border border-white/5 rounded-full"></div>
            
            {/* Tick Marks */}
            {[0, 90, 180, 270].map((deg) => (
              <div 
                key={deg} 
                className="absolute w-full h-full flex justify-center"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div className="w-1 h-3 bg-white/20 mt-1"></div>
              </div>
            ))}

            {/* Rotating Element */}
            <div 
              className="w-64 h-64 relative transition-transform duration-500 ease-out will-change-transform"
              style={{ transform: `rotate(-${heading}deg)` }}
            >
              {/* North Indicator */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 flex flex-col items-center">
                <span className="text-red-500 font-bold text-xs mb-1">N</span>
                <div className="w-1.5 h-8 bg-red-500 rounded-full"></div>
              </div>

              {/* Kaaba Pointer (The Goal) */}
              <div 
                className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ transform: `rotate(294deg)` }} // Assuming 294 is the target relative to North
              >
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-12 h-12 bg-brand-jamaah rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(31,166,106,0.6)] animate-pulse">
                       <div className="w-8 h-8 bg-black rounded border border-yellow-400/50"></div>
                    </div>
                 </div>
              </div>
            </div>
            
            {/* Center Dot */}
            <div className="w-3 h-3 bg-white rounded-full absolute z-20 box-content border-4 border-neutral-900"></div>
          </div>

          {/* Status Text */}
          <div className="mt-12 text-center">
             {calibrating ? (
               <p className="text-neutral-400 animate-pulse">Calibrating sensors...</p>
             ) : (
               <div className="flex items-center justify-center space-x-2 text-brand-mint bg-brand-mint/10 px-4 py-2 rounded-full">
                 <Navigation size={14} className="fill-current" />
                 <span className="text-sm font-medium">Qibla Aligned</span>
               </div>
             )}
          </div>

        </div>

        {/* Footer */}
        <div className="mt-auto pb-4">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <MapPin size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Current Location</p>
              <p className="text-sm font-medium">Sampang, Indonesia</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};