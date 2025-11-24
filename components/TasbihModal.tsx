
import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Settings2, CheckCircle2, Plus, Sparkles, Trash2, ArrowDown } from 'lucide-react';
import { Button } from './ui/Button';
import { DhikrPreset, TasbihMode } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ComboStep {
  id: string;
  label: string;
  arabic: string;
  target: number;
}

const PRESETS: DhikrPreset[] = [
  { label: 'SubhanAllah', arabic: 'سُبْحَانَ ٱللَّٰهِ' },
  { label: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ' },
  { label: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ' },
  { label: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ' },
  { label: 'Salawat', arabic: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ' },
  { label: 'La ilaha illallah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ' },
];

export const TasbihModal: React.FC<TasbihModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  // View State
  const [view, setView] = useState<'setup' | 'active'>('setup');
  const [mode, setMode] = useState<TasbihMode>('single');

  // Single Mode State
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrPreset>(PRESETS[0]);
  const [customInput, setCustomInput] = useState('');
  const [target, setTarget] = useState<number>(33);
  const [isCustom, setIsCustom] = useState(false);

  // Combo Builder State
  const [comboSequence, setComboSequence] = useState<ComboStep[]>([]);
  const [builderDhikr, setBuilderDhikr] = useState<DhikrPreset>(PRESETS[0]);
  const [builderTarget, setBuilderTarget] = useState<number>(33);
  const [builderCustomInput, setBuilderCustomInput] = useState('');
  const [isBuilderCustom, setIsBuilderCustom] = useState(false);

  // Session State
  const [count, setCount] = useState(0);
  const [comboIndex, setComboIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isPulse, setIsPulse] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset state and Lock Scroll
  useEffect(() => {
    if (isOpen) {
      setView('setup');
      setCount(0);
      setComboIndex(0);
      setSessionComplete(false);
      setIsTransitioning(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const startSession = () => {
    setCount(0);
    setComboIndex(0);
    setSessionComplete(false);
    setIsTransitioning(false);
    setView('active');
  };

  const addToSequence = () => {
    const label = isBuilderCustom ? (builderCustomInput || t('tasbih_custom')) : builderDhikr.label;
    const arabic = isBuilderCustom ? 'ذكر' : builderDhikr.arabic;
    
    const newStep: ComboStep = {
      id: Math.random().toString(36).substr(2, 9),
      label,
      arabic,
      target: builderTarget === 0 ? 33 : builderTarget
    };

    setComboSequence([...comboSequence, newStep]);
  };

  const removeFromSequence = (id: string) => {
    setComboSequence(comboSequence.filter(s => s.id !== id));
  };

  const handleIncrement = () => {
    if (sessionComplete || isTransitioning) return;

    const currentTarget = mode === 'combo' ? comboSequence[comboIndex].target : target;
    const newCount = count + 1;

    setIsPulse(true);
    setTimeout(() => setIsPulse(false), 100);
    if (navigator.vibrate) navigator.vibrate(5);

    if (currentTarget > 0 && newCount >= currentTarget) {
      if (mode === 'combo') {
        if (comboIndex < comboSequence.length - 1) {
          setIsTransitioning(true);
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
          setTimeout(() => {
             setCount(0);
             setComboIndex(prev => prev + 1);
             setIsTransitioning(false);
          }, 300);
        } else {
          setCount(newCount);
          setSessionComplete(true);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        }
      } else {
        setCount(newCount);
        setSessionComplete(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      }
    } else {
      setCount(newCount);
    }
  };

  const getCurrentDhikr = () => {
    if (mode === 'combo') {
       const step = comboSequence[comboIndex];
       return step ? { label: step.label, arabic: step.arabic } : { label: t('tasbih_done'), arabic: '' };
    }
    if (isCustom) return { label: customInput || t('tasbih_custom'), arabic: 'ذكر' };
    return selectedDhikr || PRESETS[0];
  };

  const getCurrentTarget = () => {
    if (mode === 'combo') return comboSequence[comboIndex]?.target || 0;
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
      <div className="bg-neutral-body w-full h-[95vh] sm:h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-neutral-card px-6 py-4 flex justify-between items-center border-b border-neutral-line relative z-10">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
             {view === 'active' && (
               <button onClick={() => setView('setup')} className="text-neutral-500 hover:text-brand-forest transition-colors">
                 <Settings2 size={20} />
               </button>
             )}
             <h3 className="text-xl font-bold text-brand-forest">{t('tasbih_title')}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <X size={24} className="text-neutral-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-neutral-body">
          
          {/* --- SETUP VIEW --- */}
          {view === 'setup' && (
            <div className="p-6 space-y-6 pb-32">
              {/* Mode Toggle */}
              <div className="bg-neutral-card p-1 rounded-xl flex shadow-sm border border-neutral-line">
                 <button 
                    onClick={() => { setMode('single'); setIsCustom(false); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'single' ? 'bg-brand-forest text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                 >
                   {t('tasbih_mode_single')}
                 </button>
                 <button 
                    onClick={() => setMode('combo')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'combo' ? 'bg-brand-forest text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                 >
                   {t('tasbih_mode_combo')}
                 </button>
              </div>

              {/* SINGLE MODE SETUP */}
              {mode === 'single' && (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-neutral-primary uppercase tracking-wide">{t('tasbih_select_dhikr')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PRESETS.map(p => (
                        <button
                          key={p.label}
                          onClick={() => { setSelectedDhikr(p); setIsCustom(false); }}
                          className={`p-3 rounded-xl border-2 text-start transition-all ${!isCustom && selectedDhikr.label === p.label ? 'border-brand-forest bg-brand-mint/30 dark:bg-brand-forest/20' : 'border-transparent bg-neutral-card shadow-sm hover:border-neutral-200 dark:hover:border-neutral-700'}`}
                        >
                          <p className="font-semibold text-sm text-neutral-primary truncate">{p.label}</p>
                          <p className="text-xs text-neutral-muted font-arabic mt-1 truncate">{p.arabic}</p>
                        </button>
                      ))}
                      <button
                        onClick={() => setIsCustom(true)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${isCustom ? 'border-brand-forest bg-brand-mint/30 dark:bg-brand-forest/20' : 'border-dashed border-neutral-300 dark:border-neutral-600 bg-transparent hover:bg-neutral-card'}`}
                      >
                         <Plus size={20} className="mb-1 text-neutral-400" />
                         <span className="text-xs font-medium text-neutral-500">{t('tasbih_custom')}</span>
                      </button>
                    </div>

                    {isCustom && (
                      <input 
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder={t('tasbih_custom_placeholder')}
                        className="w-full p-3 rounded-xl border border-neutral-line bg-neutral-card focus:ring-2 focus:ring-brand-teal outline-none shadow-sm text-neutral-primary"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-neutral-primary uppercase tracking-wide">{t('tasbih_set_goal')}</label>
                    <div className="flex space-x-3 rtl:space-x-reverse">
                      {[33, 100, 0].map(t => (
                        <button
                          key={t}
                          onClick={() => setTarget(t)}
                          className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all shadow-sm ${target === t ? 'border-brand-forest bg-brand-forest text-white' : 'border-transparent bg-neutral-card text-neutral-600 dark:text-neutral-400 hover:border-neutral-200 dark:hover:border-neutral-700'}`}
                        >
                          {t === 0 ? '∞' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* COMBO MODE SETUP (Builder) */}
              {mode === 'combo' && (
                 <div className="space-y-6">
                    
                    {/* Current Sequence List */}
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-neutral-primary uppercase tracking-wide flex justify-between items-center">
                          <span>{t('tasbih_sequence')}</span>
                          <span className="text-xs text-neutral-400 normal-case font-normal">{comboSequence.length} {t('tasbih_steps')}</span>
                       </label>
                       
                       <div className="bg-neutral-card rounded-2xl border border-neutral-line min-h-[100px] p-1">
                          {comboSequence.length === 0 ? (
                             <div className="h-24 flex flex-col items-center justify-center text-neutral-400">
                                <p className="text-xs italic">{t('tasbih_no_steps')}</p>
                             </div>
                          ) : (
                             <div className="space-y-1">
                                {comboSequence.map((step, index) => (
                                   <div key={step.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 group">
                                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                         <span className="w-6 h-6 bg-white dark:bg-neutral-700 rounded-full border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                                            {index + 1}
                                         </span>
                                         <div>
                                            <p className="text-sm font-bold text-neutral-primary">{step.label}</p>
                                            <p className="text-[10px] text-neutral-500 font-arabic">{step.arabic}</p>
                                         </div>
                                      </div>
                                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                         <span className="text-xs font-mono bg-white dark:bg-neutral-700 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-600 text-brand-forest font-bold">
                                            x{step.target}
                                         </span>
                                         <button 
                                            onClick={() => removeFromSequence(step.id)}
                                            className="text-neutral-300 hover:text-red-500 transition-colors"
                                         >
                                            <Trash2 size={16} />
                                         </button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    </div>

                    {/* Add Step Form */}
                    <div className="bg-neutral-card p-4 rounded-2xl border border-neutral-line shadow-sm space-y-4">
                       <div className="flex items-center space-x-2 rtl:space-x-reverse text-brand-teal font-medium text-xs uppercase tracking-wide mb-1">
                          <Plus size={14} />
                          <span>{t('tasbih_add_step')}</span>
                       </div>

                       {/* Step 1: Choose Dhikr */}
                       <div className="grid grid-cols-3 gap-2">
                          {PRESETS.slice(0, 5).map(p => (
                             <button
                                key={p.label}
                                onClick={() => { setBuilderDhikr(p); setIsBuilderCustom(false); }}
                                className={`p-2 rounded-lg border text-[10px] font-medium transition-all ${!isBuilderCustom && builderDhikr.label === p.label ? 'bg-brand-forest text-white border-brand-forest' : 'bg-neutral-50 dark:bg-neutral-800 border-transparent text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                             >
                                {p.label}
                             </button>
                          ))}
                          <button
                             onClick={() => setIsBuilderCustom(true)}
                             className={`p-2 rounded-lg border text-[10px] font-medium transition-all ${isBuilderCustom ? 'bg-brand-forest text-white border-brand-forest' : 'bg-neutral-50 dark:bg-neutral-800 border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300'}`}
                          >
                             {t('tasbih_custom')}
                          </button>
                       </div>

                       {isBuilderCustom && (
                          <input 
                             type="text" 
                             placeholder={t('tasbih_custom_placeholder')}
                             className="w-full text-sm p-2 rounded-lg border border-neutral-line bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:border-brand-teal text-neutral-primary"
                             value={builderCustomInput}
                             onChange={(e) => setBuilderCustomInput(e.target.value)}
                          />
                       )}

                       {/* Step 2: Choose Count */}
                       <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {[33, 34, 100].map(t => (
                             <button
                                key={t}
                                onClick={() => setBuilderTarget(t)}
                                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${builderTarget === t ? 'bg-brand-mint dark:bg-brand-forest/20 text-brand-forest dark:text-brand-mint border-brand-mint dark:border-brand-forest/20' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'}`}
                             >
                                {t}
                             </button>
                          ))}
                          <div className="relative flex-1">
                             <input 
                                type="number" 
                                value={builderTarget}
                                onChange={(e) => setBuilderTarget(parseInt(e.target.value) || 0)}
                                className="w-full py-2 text-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold focus:outline-none focus:border-brand-teal bg-white dark:bg-neutral-800 text-neutral-primary"
                             />
                             <span className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 text-[8px] text-neutral-400 uppercase">{t('tasbih_count')}</span>
                          </div>
                       </div>

                       <Button fullWidth variant="outline" onClick={addToSequence} className="border-dashed border-brand-teal text-brand-teal hover:bg-brand-mint/20 h-10 text-xs">
                          {t('tasbih_add_btn')}
                       </Button>
                    </div>

                 </div>
              )}
            </div>
          )}

          {/* --- ACTIVE VIEW --- */}
          {view === 'active' && (
            <div className="h-full flex flex-col items-center justify-center p-6 relative">
              <div className="text-center mb-8 space-y-1 min-h-[80px]">
                <h2 className="text-xl font-bold text-neutral-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {getCurrentDhikr().label}
                </h2>
                <p className="text-lg text-neutral-muted font-arabic animate-in fade-in slide-in-from-bottom-3 duration-700">
                   {getCurrentDhikr().arabic}
                </p>
                {mode === 'combo' && (
                  <div className="mt-3 animate-in fade-in duration-1000 flex flex-col items-center space-y-1">
                    <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                      {t('tasbih_step_progress').replace('{current}', (comboIndex + 1).toString()).replace('{total}', comboSequence.length.toString())}
                    </span>
                    {comboIndex < comboSequence.length - 1 && (
                       <span className="text-[10px] text-neutral-400 flex items-center">
                          {t('tasbih_next')}: {comboSequence[comboIndex + 1].label} <ArrowDown size={10} className="ms-1" />
                       </span>
                    )}
                  </div>
                )}
              </div>

              <div 
                onClick={handleIncrement}
                className="relative w-72 h-72 flex items-center justify-center mb-8 cursor-pointer select-none touch-manipulation"
              >
                {/* Progress Ring SVG */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 288 288">
                  <circle cx="144" cy="144" r="135" stroke="currentColor" strokeWidth="5" fill="none" className="text-neutral-100 dark:text-neutral-800" />
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

                <div className={`
                    w-64 h-64 rounded-full bg-neutral-card
                    shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)]
                    border border-neutral-100 dark:border-neutral-700
                    flex items-center justify-center
                    transition-transform duration-75 ease-out
                    ${!sessionComplete && 'active:scale-95 active:bg-neutral-50 dark:active:bg-neutral-800'}
                `}>
                   {sessionComplete ? (
                     <div className="flex flex-col items-center animate-in zoom-in duration-300">
                       <CheckCircle2 size={48} className="text-brand-jamaah mb-2" />
                       <span className="font-bold text-lg text-brand-jamaah">{t('tasbih_done')}</span>
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Sparkles className="absolute -top-4 -right-4 rtl:-left-4 text-yellow-400 animate-pulse" size={24} />
                          <Sparkles className="absolute bottom-4 -left-4 rtl:-right-4 text-brand-home animate-pulse delay-100" size={20} />
                       </div>
                     </div>
                   ) : (
                     <div className="text-center">
                       <span className={`
                           block text-7xl font-bold text-neutral-800 dark:text-neutral-100 font-mono tracking-tighter
                           transition-transform duration-75
                           ${isPulse ? 'scale-105 text-brand-forest' : 'scale-100'}
                       `}>
                         {count}
                       </span>
                       <span className="text-xs text-neutral-400 font-medium uppercase tracking-widest mt-1 block">
                         {getCurrentTarget() > 0 ? `/ ${getCurrentTarget()}` : t('tasbih_count')}
                       </span>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex space-x-4 rtl:space-x-reverse w-full max-w-xs opacity-60 hover:opacity-100 transition-opacity duration-300">
                <Button variant="ghost" fullWidth onClick={() => { setCount(0); setSessionComplete(false); }} className="hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50">
                  <RotateCcw size={16} className="me-2" /> {t('tasbih_reset')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTION */}
        {view === 'setup' && (
          <div className="p-6 bg-neutral-card border-t border-neutral-line z-10">
            <Button 
              fullWidth 
              size="lg" 
              onClick={startSession} 
              disabled={mode === 'combo' && comboSequence.length === 0}
              className={`shadow-lg shadow-brand-forest/30 ${mode === 'combo' && comboSequence.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mode === 'single' ? t('tasbih_start_single') : `${t('tasbih_start_combo')} (${comboSequence.length})`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
