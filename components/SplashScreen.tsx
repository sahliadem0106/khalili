
import React, { useEffect, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [animationPhase, setAnimationPhase] = useState<'racing' | 'zooming' | 'hidden'>('racing');
  const { t } = useLanguage();

  // Generate 9 random stars for the ascent
  const racers = useMemo(() => {
    return Array.from({ length: 9 }).map((_, i) => ({
      id: i,
      // Spread stars across the width (10% - 90%)
      left: `${10 + (i * 10) + (Math.random() * 6 - 3)}%`, 
      // Duration between 2.5s - 3.5s for a nice ascent
      duration: 2.5 + Math.random() * 1.0, 
      // Slight delay so they don't all appear in a straight line
      delay: Math.random() * 0.4, 
      // Varied sizes
      size: 20 + Math.random() * 16, 
      // Alternating Gold and White colors
      color: i % 2 === 0 ? 'text-yellow-300 fill-yellow-300' : 'text-white fill-white',
      // Trail length
      trailHeight: 80 + Math.random() * 40
    }));
  }, []);

  useEffect(() => {
    // Sequence:
    // 0s - 3.2s: Stars rise
    // 3.2s: Star Zoom transition starts
    // 4.5s: Animation completes (extended to let zoom finish)
    
    const zoomTimer = setTimeout(() => {
      setAnimationPhase('zooming');
    }, 3200);

    const finishTimer = setTimeout(() => {
      setAnimationPhase('hidden');
      onFinish();
    }, 4500);

    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[100] overflow-hidden flex items-center justify-center bg-neutral-900 transition-opacity duration-700 ${animationPhase === 'hidden' ? 'opacity-0' : 'opacity-100'}`}
      style={{ 
        background: 'linear-gradient(to bottom, #020617 0%, #0f766e 100%)', // Deep Space to Brand Teal
      }}
    >
      <style>{`
        /* Smooth ascent from below screen to WAY up */
        @keyframes riseUp {
          0% { transform: translateY(120vh); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(-150vh); opacity: 1; }
        }
        
        /* Glow pulse for stars */
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(255,255,255,0.5)); }
          50% { filter: drop-shadow(0 0 12px rgba(255,255,255,0.9)); }
        }

        /* Final Star portal zoom */
        @keyframes starExpand {
          0% { transform: scale(0.1) rotate(0deg); opacity: 0; }
          30% { opacity: 1; transform: scale(1.5) rotate(45deg); }
          100% { transform: scale(80) rotate(90deg); opacity: 1; }
        }

        .portal-anim { animation: starExpand 1.5s cubic-bezier(0.7, 0, 0.84, 0) forwards; }
      `}</style>

      {/* --- CENTER BRANDING --- */}
      <div className={`relative z-10 text-center transition-all duration-500 ${animationPhase === 'zooming' ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}>
        <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 to-yellow-500 mb-4 tracking-tighter drop-shadow-lg font-sans">Khalili</h1>
        <div className="inline-block px-5 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
           <p className="text-brand-mint text-[10px] font-bold tracking-[0.3em] uppercase">
             {t('splash_slogan')}
           </p>
        </div>
      </div>

      {/* --- 9 RISING STARS (Foreground) --- */}
      <div className={`absolute inset-0 w-full h-full pointer-events-none ${animationPhase === 'zooming' ? 'opacity-0 transition-opacity duration-500' : 'opacity-100'}`}>
          {racers.map((star) => (
             <div 
                key={star.id}
                className="absolute bottom-0 flex flex-col items-center"
                style={{ 
                   left: star.left,
                   // "both" ensures the 0% keyframe is applied immediately (hiding them at bottom)
                   animation: `riseUp ${star.duration}s cubic-bezier(0.25, 0.1, 0.25, 1) both`, 
                   animationDelay: `${star.delay}s`
                }}
             >
                 {/* Star Icon */}
                 <div className="animate-[pulseGlow_2s_infinite]">
                    <Star 
                       size={star.size} 
                       className={`${star.color}`} 
                       fill="currentColor"
                       strokeWidth={0} 
                    />
                 </div>
                 
                 {/* Light Trail */}
                 <div 
                    className="w-[1px] bg-gradient-to-t from-transparent via-white/50 to-white blur-[0.5px] -mt-1 rounded-full opacity-60"
                    style={{ height: `${star.trailHeight}px` }} 
                 ></div>
             </div>
          ))}
      </div>

      {/* --- SHINING STAR PORTAL (Transition) --- */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${animationPhase === 'zooming' ? 'block' : 'hidden'}`}>
         <div className="portal-anim text-white filter drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]">
            <Star size={100} fill="currentColor" strokeWidth={0} />
         </div>
      </div>

    </div>
  );
};
