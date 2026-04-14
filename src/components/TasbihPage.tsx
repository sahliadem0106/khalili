
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Settings2, CheckCircle2, Plus, Sparkles, Trash2, ArrowDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { DhikrPreset, TasbihMode } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { tasbihLogService } from '../services/TasbihLogService';

interface TasbihPageProps {
    onBack?: () => void;
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

export const TasbihPage: React.FC<TasbihPageProps> = ({ onBack }) => {
    const { t, dir } = useLanguage();
    const BackIcon = dir === 'rtl' ? ChevronRight : ArrowLeft;

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

    // Initialization
    useEffect(() => {
        setView('setup');
        setCount(0);
        setComboIndex(0);
        setSessionComplete(false);
        setIsTransitioning(false);
    }, []);

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
                    // Log completed combo session
                    const totalCount = comboSequence.reduce((sum, step) => sum + step.target, 0);
                    tasbihLogService.logSession(
                        comboSequence.map(s => s.label).join(' + '),
                        comboSequence.map(s => s.arabic).join(' | '),
                        totalCount,
                        totalCount,
                        'combo'
                    );
                }
            } else {
                setCount(newCount);
                setSessionComplete(true);
                if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
                // Log completed single session
                const dhikr = getCurrentDhikr();
                tasbihLogService.logSession(
                    dhikr.label,
                    dhikr.arabic,
                    newCount,
                    currentTarget > 0 ? currentTarget : null,
                    'single'
                );
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

    return (
        <div className="min-h-screen bg-brand-background pb-20 animate-in fade-in duration-300">

            {/* HEADER */}
            <div className="bg-brand-surface/90 backdrop-blur-md px-4 py-4 sticky top-0 z-20 border-b border-brand-border shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 -ml-2 rounded-full hover:bg-brand-subtle text-brand-forest transition-colors"
                                aria-label={t('back')}
                            >
                                <BackIcon size={22} />
                            </button>
                        )}
                        <h3 className="text-xl font-bold text-brand-forest font-outfit">{t('tasbih_title')}</h3>
                    </div>

                    {view === 'active' && (
                        <button
                            onClick={() => setView('setup')}
                            className="p-2 -mr-2 rounded-full hover:bg-brand-subtle text-brand-muted hover:text-brand-primary transition-colors"
                            aria-label={t('settings')}
                        >
                            <Settings2 size={22} />
                        </button>
                    )}
                </div>
            </div>

            {/* BODY */}
            <div className="px-4 py-6">

                {/* --- SETUP VIEW --- */}
                {view === 'setup' && (
                    <div className="space-y-6 max-w-lg mx-auto">
                        {/* Mode Toggle */}
                        <div className="bg-brand-surface border border-brand-border p-1 rounded-2xl flex shadow-sm">
                            <button
                                onClick={() => { setMode('single'); setIsCustom(false); }}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all font-outfit ${mode === 'single' ? 'bg-brand-primary text-white shadow-md' : 'text-brand-muted hover:bg-brand-subtle'}`}
                            >
                                {t('tasbih_mode_single')}
                            </button>
                            <button
                                onClick={() => setMode('combo')}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all font-outfit ${mode === 'combo' ? 'bg-brand-primary text-white shadow-md' : 'text-brand-muted hover:bg-brand-subtle'}`}
                            >
                                {t('tasbih_mode_combo')}
                            </button>
                        </div>

                        {/* SINGLE MODE SETUP */}
                        {mode === 'single' && (
                            <>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-brand-muted uppercase tracking-widest px-1">{t('tasbih_select_dhikr')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {PRESETS.map(p => (
                                            <button
                                                key={p.label}
                                                onClick={() => { setSelectedDhikr(p); setIsCustom(false); }}
                                                className={`p-4 rounded-2xl border text-start transition-all relative overflow-hidden group ${!isCustom && selectedDhikr.label === p.label
                                                    ? 'border-brand-primary bg-brand-primary/10'
                                                    : 'border-brand-border bg-brand-surface hover:border-brand-primary/30'}`}
                                            >
                                                <p className={`font-bold text-sm truncate font-outfit ${!isCustom && selectedDhikr.label === p.label ? 'text-brand-primary' : 'text-brand-forest'}`}>{p.label}</p>
                                                <p className="text-xs text-brand-muted font-arabic mt-1 truncate group-hover:text-brand-primary/80 transition-colors">{p.arabic}</p>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setIsCustom(true)}
                                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center transition-all ${isCustom
                                                ? 'border-brand-primary bg-brand-primary/10'
                                                : 'border-dashed border-brand-border bg-transparent hover:bg-brand-subtle'}`}
                                        >
                                            <Plus size={20} className={`mb-1 ${isCustom ? 'text-brand-primary' : 'text-brand-muted'}`} />
                                            <span className={`text-xs font-bold ${isCustom ? 'text-brand-primary' : 'text-brand-muted'}`}>{t('tasbih_custom')}</span>
                                        </button>
                                    </div>

                                    {isCustom && (
                                        <input
                                            type="text"
                                            value={customInput}
                                            onChange={(e) => setCustomInput(e.target.value)}
                                            placeholder={t('tasbih_custom_placeholder')}
                                            className="w-full p-4 rounded-2xl bg-brand-surface border border-brand-border focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none shadow-inner text-brand-forest placeholder-brand-muted text-xl font-bold font-arabic"
                                        />
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-brand-muted uppercase tracking-widest px-1">{t('tasbih_set_goal')}</label>
                                    <div className="flex space-x-3 rtl:space-x-reverse">
                                        {[33, 100, 0].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTarget(t)}
                                                className={`flex-1 py-3 rounded-xl border font-bold transition-all shadow-sm ${target === t
                                                    ? 'border-brand-primary bg-brand-primary text-white shadow-brand-primary/20'
                                                    : 'border-brand-border bg-brand-surface text-brand-forest hover:bg-brand-subtle'}`}
                                            >
                                                {t === 0 ? '∞' : t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        fullWidth
                                        size="lg"
                                        onClick={startSession}
                                        className="shadow-lg shadow-brand-primary/20 bg-brand-primary hover:bg-brand-primary/90 text-white border-none py-4 text-lg font-bold rounded-2xl"
                                    >
                                        {t('tasbih_start_single')}
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* COMBO MODE SETUP (Builder) */}
                        {mode === 'combo' && (
                            <div className="space-y-6">
                                {/* Current Sequence List */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-brand-muted uppercase tracking-widest flex justify-between items-center px-1">
                                        <span>{t('tasbih_sequence')}</span>
                                        <span className="text-xs bg-brand-surface px-2 py-0.5 rounded-full border border-brand-border text-brand-muted">{comboSequence.length} {t('tasbih_steps')}</span>
                                    </label>

                                    <div className="bg-brand-surface rounded-2xl border border-brand-border min-h-[100px] p-2">
                                        {comboSequence.length === 0 ? (
                                            <div className="h-24 flex flex-col items-center justify-center text-neutral-400/50">
                                                <p className="text-xs italic font-medium">{t('tasbih_no_steps')}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {comboSequence.map((step, index) => (
                                                    <div key={step.id} className="flex items-center justify-between p-4 bg-brand-surface rounded-xl border border-brand-border hover:border-brand-primary/20 group transition-colors shadow-sm">
                                                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                                            <span className="w-8 h-8 bg-brand-background rounded-full border border-brand-border flex items-center justify-center text-xs font-bold text-brand-primary">
                                                                {index + 1}
                                                            </span>
                                                            <div>
                                                                <p className="text-lg font-bold text-brand-forest">{step.label}</p>
                                                                <p className="text-sm text-brand-muted font-arabic">{step.arabic}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                                            <span className="text-sm font-mono bg-brand-background px-3 py-1.5 rounded-lg border border-brand-border text-brand-forest font-bold">
                                                                x{step.target}
                                                            </span>
                                                            <button
                                                                onClick={() => removeFromSequence(step.id)}
                                                                className="text-brand-muted hover:text-rose-500 transition-colors p-2"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Add Step Form */}
                                <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-sm space-y-4">
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-brand-primary font-bold text-sm uppercase tracking-wide mb-1">
                                        <Plus size={18} />
                                        <span>{t('tasbih_add_step')}</span>
                                    </div>

                                    {/* Step 1: Choose Dhikr */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {PRESETS.slice(0, 5).map(p => (
                                            <button
                                                key={p.label}
                                                onClick={() => { setBuilderDhikr(p); setIsBuilderCustom(false); }}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${!isBuilderCustom && builderDhikr.label === p.label
                                                    ? 'bg-brand-primary text-white border-brand-primary'
                                                    : 'bg-brand-background border-brand-border text-brand-muted hover:bg-brand-subtle'}`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setIsBuilderCustom(true)}
                                            className={`p-3 rounded-xl border text-sm font-bold transition-all ${isBuilderCustom
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-brand-background border-dashed border-brand-border text-brand-muted'}`}
                                        >
                                            {t('tasbih_custom')}
                                        </button>
                                    </div>

                                    {isBuilderCustom && (
                                        <input
                                            type="text"
                                            placeholder={t('tasbih_custom_placeholder')}
                                            className="w-full text-lg p-3 rounded-xl border border-brand-border bg-brand-background focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary text-brand-forest font-arabic"
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
                                                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${builderTarget === t
                                                    ? 'bg-brand-primary/10 text-brand-primary border-brand-primary'
                                                    : 'bg-brand-background border-brand-border text-brand-muted'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={builderTarget}
                                                onChange={(e) => setBuilderTarget(parseInt(e.target.value) || 0)}
                                                className="w-full py-3 text-center rounded-xl border border-brand-border bg-brand-background text-sm font-bold focus:outline-none focus:border-brand-primary text-brand-forest"
                                            />
                                            <span className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted uppercase">{t('tasbih_count')}</span>
                                        </div>
                                    </div>

                                    <Button fullWidth variant="outline" onClick={addToSequence} className="border-dashed border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5 h-12 text-base rounded-xl font-bold">
                                        {t('tasbih_add_btn')}
                                    </Button>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        fullWidth
                                        size="lg"
                                        onClick={startSession}
                                        disabled={comboSequence.length === 0}
                                        className={`shadow-lg shadow-brand-primary/20 bg-brand-primary hover:bg-brand-primary/90 text-white border-none py-4 text-xl font-bold rounded-2xl ${comboSequence.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {`${t('tasbih_start_combo')} (${comboSequence.length})`}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ACTIVE VIEW --- */}
                {view === 'active' && (
                    <div className="h-[80vh] flex flex-col items-center justify-center p-6 relative">
                        <div className="text-center mb-10 space-y-2 min-h-[100px] flex flex-col items-center justify-center">
                            <h2 className="text-5xl font-bold text-brand-forest animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit text-center leading-tight">
                                {getCurrentDhikr().label}
                            </h2>
                            <p className="text-4xl text-brand-primary font-arabic animate-in fade-in slide-in-from-bottom-3 duration-700 leading-relaxed text-center py-2">
                                {getCurrentDhikr().arabic}
                            </p>
                            {mode === 'combo' && (
                                <div className="mt-4 animate-in fade-in duration-1000 flex flex-col items-center space-y-1">
                                    <span className="px-3 py-1 bg-brand-surface rounded-full text-xs font-bold text-brand-primary border border-brand-primary/10">
                                        {t('tasbih_step_progress').replace('{current}', (comboIndex + 1).toString()).replace('{total}', comboSequence.length.toString())}
                                    </span>
                                    {comboIndex < comboSequence.length - 1 && (
                                        <span className="text-[10px] text-brand-muted flex items-center font-medium mt-1">
                                            {t('tasbih_next')}: {comboSequence[comboIndex + 1].label} <ArrowDown size={10} className="ms-1" />
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div
                            onClick={handleIncrement}
                            className="relative w-80 h-80 flex items-center justify-center mb-12 cursor-pointer select-none touch-manipulation group"
                        >
                            {/* Progress Ring SVG */}
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none filter drop-shadow-xl" viewBox="0 0 288 288">
                                {/* Track */}
                                <circle cx="144" cy="144" r="135" stroke="rgba(148,163,184,0.2)" strokeWidth="8" fill="none" />
                                {/* Progress */}
                                <circle
                                    cx="144" cy="144" r="135"
                                    stroke={sessionComplete ? "#10b981" : "#1ea38c"}
                                    strokeWidth="8" fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 135}
                                    strokeDashoffset={2 * Math.PI * 135 * (1 - getProgressPercent() / 100)}
                                    className="transition-all duration-200 ease-linear"
                                />
                            </svg>

                            {/* Main Circle Button */}
                            <div className={`
                  w-72 h-72 rounded-full 
                  bg-gradient-to-br from-brand-surface to-brand-background
                  border border-brand-border
                  shadow-[inset_0_-4px_4px_rgba(0,0,0,0.08),0_0_0_4px_rgba(255,255,255,0.04)]
                  flex items-center justify-center
                  transition-all duration-100 ease-out
                  group-active:scale-95 group-active:shadow-inner
              `}>
                                {sessionComplete ? (
                                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-3">
                                            <CheckCircle2 size={40} className="text-brand-primary" />
                                        </div>
                                        <span className="font-bold text-xl text-brand-primary font-outfit tracking-wide">{t('tasbih_done')}</span>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <Sparkles className="absolute -top-4 -right-4 rtl:-left-4 text-emerald-300 animate-pulse" size={24} />
                                            <Sparkles className="absolute bottom-4 -left-4 rtl:-right-4 text-emerald-500 animate-pulse delay-100" size={20} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <span className={`
                         block text-8xl font-bold text-brand-forest font-outfit tracking-tighter
                         transition-transform duration-75 drop-shadow-sm
                         ${isPulse ? 'scale-110 text-brand-primary' : 'scale-100'}
                     `}>
                                            {count}
                                        </span>
                                        <span className="text-sm text-brand-muted font-bold uppercase tracking-widest mt-2 block">
                                            {getCurrentTarget() > 0 ? `/ ${getCurrentTarget()}` : t('tasbih_count')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex space-x-4 rtl:space-x-reverse w-full max-w-xs opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <Button variant="ghost" fullWidth onClick={() => { setCount(0); setSessionComplete(false); }} className="hover:bg-brand-subtle text-brand-muted hover:text-brand-forest">
                                <RotateCcw size={18} className="me-2" /> {t('tasbih_reset')}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
