
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Clock, MapPin } from 'lucide-react';
import { IMAGES } from '../constants';

interface PrayerCardProps {
  nextPrayerName: string;
  nextPrayerTime: string;
  currentTimeStr: string; // Format HH:MM
}

export const PrayerCard: React.FC<PrayerCardProps> = ({ nextPrayerName, nextPrayerTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Simulate countdown logic based on nextPrayerTime
  useEffect(() => {
    const calculateTimeLeft = () => {
      // Mock calculation for demo purposes since we don't have a real time engine in this context
      // In a real app, this would parse HH:MM vs current Date()
      const now = new Date();
      // Just show a static countdown decremented for visual effect for this demo
      const target = new Date();
      const [hours, minutes] = nextPrayerTime.split(':').map(Number);
      target.setHours(hours, minutes, 0);
      
      if (target < now) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const m = Math.floor((diff / 1000 / 60) % 60);
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      
      setTimeLeft(`${h}h ${m}m`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [nextPrayerTime]);

  return (
    <div id="next-prayer-card">
      <Card className="mb-6 relative overflow-visible border border-brand-mint/50">
        <div className="flex justify-between items-start">
          <div className="z-10">
            <div className="flex items-center space-x-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-mint text-brand-forest">
                <Clock size={14} />
              </span>
              <span className="text-sm font-medium text-brand-forest uppercase tracking-wider">Next Prayer</span>
            </div>
            
            <h2 className="text-4xl font-bold text-neutral-primary mb-1">{nextPrayerTime}</h2>
            <p className="text-lg text-neutral-muted font-medium mb-4">{nextPrayerName}</p>
            
            <div className="inline-flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 mb-5">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-orange-700">
                {timeLeft || "53m"} remaining
              </span>
            </div>

            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/20">
              Set Ramadan Routine
            </Button>
          </div>

          {/* Image Container */}
          <div className="absolute top-4 right-4 w-32 h-40 rounded-xl overflow-hidden shadow-md rotate-3 border-2 border-white">
            <img 
              src={IMAGES.mosqueCard} 
              alt="Mosque" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
               <div className="flex items-center text-white/90">
                  <MapPin size={10} className="mr-1" />
                  <span className="text-[10px] font-medium truncate">Nearest Mosque</span>
               </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
