import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Settings2, CheckCircle2, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { DhikrPreset, TasbihMode } from '../types';

interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS: DhikrPreset[] = [
  { label: 'SubhanAllah', arabic: 'سُبْحَانَ ٱللَّٰهِ' },
  { label: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ' },
  { label: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ' },
  { label: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ' },
  { label: 'Salawat', arabic: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ' },
  { label: 'La ilaha illallah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ' },
];

const COMBO_STEPS = [
  { label: 'SubhanAllah', arabic: 'سُبْحَانَ ٱللَّٰهِ', target: 33 },
  { label: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', target: 33 },
  { label: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', target: 34 },
];

export const TasbihModal: React.FC<TasbihModalProps> = ({ isOpen, onClose }) => {
  // View State: 'setup' or 'active'
  const [view, setView] = useState<'setup' | 'active'>('setup');
  
  // Configuration State
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrPreset>(PRESETS[0]);
  const [customInput, setCustomInput] = useState('');
  const [target, setTarget] = useState<number>(33); // 0 for infinity
  const [mode, setMode] = useState<TasbihMode>('single');
  const [isCustom, setIsCustom] = useState(false);

  // Active Session State
  const [count, setCount] = useState(0);
  const [comboIndex, setComboIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isPulse, setIsPulse] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setView('setup');
      setCount(0);
      setComboIndex(0);
      setSessionComplete(false);
      setIsTransitioning(false);
    }
  }, [isOpen]);

  const startSession = () => {
    setCount(0);
    setComboIndex(0);
    setSessionComplete(false);
    setIsTransitioning(false);
    setView('active');
  };

  const handleIncrement = () => {
    if (sessionComplete || isTransitioning) return;

    const currentTarget = mode === 'combo' ? COMBO_STEPS[comboIndex].target : target;
    const newCount = count + 1;

    // Trigger text animation
    setIsPulse(true);
    setTimeout(() => setIsPulse(false), 100);

    // Handle vibration
    if (navigator.vibrate) navigator.vibrate(5);

    // Check completion
    if (currentTarget > 0 && newCount >= currentTarget) {
      if (mode === 'combo') {
        if (comboIndex < COMBO_STEPS.length - 1) {
          // Move to next step in combo
          setIsTransitioning(true);
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
          setTimeout(() => {
             setCount(0);
             setComboIndex(prev => prev + 1);
             setIsTransitioning(false);
          }, 300); // Small delay for visual feedback
        } else {
          // Combo finished
          setCount(newCount);
          setSessionComplete(true);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        }
      } else {
        // Single mode finished
        setCount(newCount);
        setSessionComplete(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      }
    } else {
      setCount(newCount);
    }
  };

  // Helpers for display
  const getCurrentDhikr = () => {
    if (mode === 'combo') return COMBO_STEPS[comboIndex] || COMBO_STEPS[0];
    if (isCustom) return { label: customInput || 'Custom Dhikr', arabic: 'ذكر' };
    return selectedDhikr || PRESETS[0];
  };

  const getCurrentTarget = () => {
    if (mode === 'combo') return COMBO_STEPS[comboIndex].target;
    return target;
  };

  const getProgressPercent = () => {
    const t = getCurrentTarget();
    if (t === 0) return 0;
    return Math.min(100, (count / t) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-body w-full h-[90vh] sm:h-auto sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-neutral-line relative z-10">
          <div className="flex items-center space-x-2">
             {view === 'active' && (
               <button onClick={() => setView('setup')} className="mr-2 text-neutral-500 hover:text-brand-forest transition-colors">
                 <Settings2 size={20} />
               </button>
             )}
             <h3 className="text-xl font-bold text-brand-forest">Digital Tasbih</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={24} className="text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-neutral-body">
          
          {/* SETUP VIEW */}
          {view === 'setup' && (
            <div className="p-6 space-y-8">
              
              {/* Mode Selection */}
              <div className="bg-white p-1 rounded-xl flex shadow-sm border border-neutral-line">
                 <button 
                    onClick={() => { setMode('single'); setIsCustom(false); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'single' ? 'bg-brand-forest text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-50'}`}
                 >
                   Single
                 </button>
                 <button 
                    onClick={() => setMode('combo')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'combo' ? 'bg-brand-forest text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-50'}`}
                 >
                   Fatima Combo
                 </button>
              </div>

              {mode === 'single' && (
                <>
                  {/* Dhikr Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-neutral-primary uppercase tracking-wide">Select Dhikr</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PRESETS.map(p => (
                        <button
                          key={p.label}
                          onClick={() => { setSelectedDhikr(p); setIsCustom(false); }}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${!isCustom && selectedDhikr.label === p.label ? 'border-brand-forest bg-brand-mint/30' : 'border-transparent bg-white shadow-sm hover:border-neutral-200'}`}
                        >
                          <p className="font-semibold text-sm text-neutral-primary truncate">{p.label}</p>
                          <p className="text-xs text-neutral-muted font-arabic mt-1 truncate">{p.arabic}</p>
                        </button>
                      ))}
                      {/* Custom Option */}
                      <button
                        onClick={() => setIsCustom(true)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${isCustom ? 'border-brand-forest bg-brand-mint/30' : 'border-dashed border-neutral-300 bg-transparent hover:bg-white'}`}
                      >
                         <Plus size={20} className="mb-1 text-neutral-400" />
                         <span className="text-xs font-medium text-neutral-500">Custom</span>
                      </button>
                    </div>

                    {isCustom && (
                      <input 
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Type your custom Dhikr..."
                        className="w-full p-3 rounded-xl border border-neutral-line focus:ring-2 focus:ring-brand-teal outline-none shadow-sm"
                      />
                    )}
                  </div>

                  {/* Target Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-neutral-primary uppercase tracking-wide">Set Goal</label>
                    <div className="flex space-x-3">
                      {[33, 100, 0].map(t => (
                        <button
                          key={t}
                          onClick={() => setTarget(t)}
                          className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all shadow-sm ${target === t ? 'border-brand-forest bg-brand-forest text-white' : 'border-transparent bg-white text-neutral-600 hover:border-neutral-200'}`}
                        >
                          {t === 0 ? '∞' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {mode === 'combo' && (
                 <div className="bg-white p-5 rounded-2xl border border-neutral-line space-y-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-brand-forest font-bold">1</div>
                       <div><p className="font-bold text-neutral-primary">SubhanAllah</p><p className="text-xs text-neutral-500">33 times</p></div>
                    </div>
                    <div className="w-0.5 h-4 bg-neutral-200 ml-5"></div>
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-brand-forest font-bold">2</div>
                       <div><p className="font-bold text-neutral-primary">Alhamdulillah</p><p className="text-xs text-neutral-500">33 times</p></div>
                    </div>
                    <div className="w-0.5 h-4 bg-neutral-200 ml-5"></div>
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-brand-forest font-bold">3</div>
                       <div><p className="font-bold text-neutral-primary">Allahu Akbar</p><p className="text-xs text-neutral-500">34 times</p></div>
                    </div>
                 </div>
              )}
            </div>
          )}

          {/* ACTIVE VIEW */}
          {view === 'active' && (
            <div className="h-full flex flex-col items-center justify-center p-6 relative">
              
              <div className="text-center mb-8 space-y-1 min-h-[60px]">
                <h2 className="text-xl font-bold text-neutral-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {getCurrentDhikr().label}
                </h2>
                <p className="text-lg text-neutral-muted font-arabic animate-in fade-in slide-in-from-bottom-3 duration-700">
                   {getCurrentDhikr().arabic}
                </p>
                {mode === 'combo' && (
                  <div className="mt-2 animate-in fade-in duration-1000">
                    <span className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600">
                      Step {comboIndex + 1} / 3
                    </span>
                  </div>
                )}
              </div>

              {/* Simplified Counter UI */}
              <div 
                onClick={handleIncrement}
                className="relative w-72 h-72 flex items-center justify-center mb-8 cursor-pointer select-none touch-manipulation"
              >
                {/* 1. The Progress Ring (Outer Layer) */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 288 288">
                  {/* Background Track */}
                  <circle
                    cx="144" cy="144" r="135"
                    stroke="#F3F4F6" strokeWidth="5" fill="none"
                  />
                  {/* Active Progress */}
                  <circle
                    cx="144" cy="144" r="135"
                    stroke={sessionComplete ? "#1FA66A" : "#0F6B4A"} 
                    strokeWidth="5" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 135}
                    strokeDashoffset={2 * Math.PI * 135 * (1 - getProgressPercent() / 100)}
                    className="transition-all duration-200 ease-linear"
                  />
                </svg>

                {/* 2. The Clickable Button (Inner Layer) */}
                <div className={`
                    w-64 h-64 rounded-full bg-white 
                    shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)]
                    border border-neutral-100
                    flex items-center justify-center
                    transition-transform duration-75 ease-out
                    ${!sessionComplete && 'active:scale-95 active:bg-neutral-50'}
                `}>
                   {sessionComplete ? (
                     <div className="flex flex-col items-center animate-in zoom-in duration-300">
                       <CheckCircle2 size={48} className="text-brand-jamaah mb-2" />
                       <span className="font-bold text-lg text-brand-jamaah">Done</span>
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Sparkles className="absolute -top-4 -right-4 text-yellow-400 animate-pulse" size={24} />
                          <Sparkles className="absolute bottom-4 -left-4 text-brand-home animate-pulse delay-100" size={20} />
                       </div>
                     </div>
                   ) : (
                     <div className="text-center">
                       <span className={`
                           block text-7xl font-bold text-neutral-800 font-mono tracking-tighter
                           transition-transform duration-75
                           ${isPulse ? 'scale-105 text-brand-forest' : 'scale-100'}
                       `}>
                         {count}
                       </span>
                       <span className="text-xs text-neutral-400 font-medium uppercase tracking-widest mt-1 block">
                         {getCurrentTarget() > 0 ? `/ ${getCurrentTarget()}` : 'Count'}
                       </span>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex space-x-4 w-full max-w-xs opacity-60 hover:opacity-100 transition-opacity duration-300">
                <Button variant="ghost" fullWidth onClick={() => { setCount(0); setSessionComplete(false); }} className="hover:bg-neutral-200/50">
                  <RotateCcw size={16} className="mr-2" /> Reset
                </Button>
              </div>

            </div>
          )}
        </div>

        {/* Footer Action for Setup */}
        {view === 'setup' && (
          <div className="p-6 bg-white border-t border-neutral-line z-10">
            <Button fullWidth size="lg" onClick={startSession} className="shadow-lg shadow-brand-forest/30">
              Start Tasbih
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
