
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Check, X, Sprout, Flame, Trash2, 
  ChevronRight, Shield, Leaf, Loader2,
  Lightbulb, PlayCircle, FileText, Sparkles, Quote, AlertTriangle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Habit, HabitType } from '../types';
import { getHabitAdvice } from '../services/genAiService';
import { useLanguage } from '../contexts/LanguageContext';

interface HabitTrackerProps {
  onBack?: () => void;
}

const INITIAL_HABITS: Habit[] = [
  {
    id: '1',
    title: 'Read Quran after Fajr',
    type: 'build',
    niyyah: 'To enlighten my heart and start the day with Barakah.',
    startDate: new Date().toISOString(),
    streak: 3,
    totalDays: 12,
    logs: [],
  }
];

const RESOURCES = [
  { id: 1, type: 'video', title: 'Atomic Habits from an Islamic Perspective', duration: '12 min', author: 'Muhammad Al-Shareef' },
  { id: 2, type: 'video', title: 'How to Break Bad Habits (Tazkiyah)', duration: '8 min', author: 'Yasir Qadhi' },
  { id: 3, type: 'article', title: 'The 40-Day Rule in Spirituality', readTime: '5 min read', author: 'Yaqeen Institute' },
];

export const HabitTracker: React.FC<HabitTrackerProps> = ({ onBack }) => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('muslimDaily_habits');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });
  
  // UI States
  const [activeTab, setActiveTab] = useState<'tracker' | 'journey'>('tracker');
  const [view, setView] = useState<'dashboard' | 'add' | 'detail'>('dashboard');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [logStatus, setLogStatus] = useState<'success' | 'fail'>('success');
  const [reflection, setReflection] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiAdvice, setAiAdvice] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Add Form State
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitType, setNewHabitType] = useState<HabitType>('build');
  const [newHabitNiyyah, setNewHabitNiyyah] = useState('');

  const { t, language } = useLanguage();

  const FEELING_TAGS = useMemo(() => [
    { id: 'grateful', label: t('feel_habit_grateful'), icon: '🤲' },
    { id: 'tired', label: t('feel_habit_tired'), icon: '😴' },
    { id: 'rushed', label: t('feel_habit_rushed'), icon: '🏃' },
    { id: 'focused', label: t('feel_habit_focused'), icon: '👁️' },
    { id: 'struggling', label: t('feel_habit_struggling'), icon: '🏔️' },
  ], [t]);

  useEffect(() => {
    localStorage.setItem('muslimDaily_habits', JSON.stringify(habits));
  }, [habits]);

  // Dynamic Badges with Translations
  const unlockedBadges = useMemo(() => {
    const badgeList = [
      { id: 'b1', label: t('badge_bismillah'), desc: t('badge_bismillah_desc'), icon: '🌱', locked: false },
      { id: 'b2', label: t('badge_istiqamah'), desc: t('badge_istiqamah_desc'), icon: '🔥', locked: true },
      { id: 'b3', label: t('badge_nafs_tamer'), desc: t('badge_nafs_tamer_desc'), icon: '🛡️', locked: true },
      { id: 'b4', label: t('badge_fajr_warrior'), desc: t('badge_fajr_warrior_desc'), icon: '🌅', locked: true },
    ];

    return badgeList.map(b => {
      if (b.id === 'b1') return { ...b, locked: habits.length === 0 };
      if (b.id === 'b2') return { ...b, locked: !habits.some(h => h.streak >= 7) };
      if (b.id === 'b3') return { ...b, locked: !habits.some(h => h.type === 'quit' && h.totalDays > 0) };
      return b;
    });
  }, [habits, t]);

  const addHabit = () => {
    if (!newHabitTitle || !newHabitNiyyah) return;
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: newHabitTitle,
      type: newHabitType,
      niyyah: newHabitNiyyah,
      startDate: new Date().toISOString(),
      streak: 0,
      totalDays: 0,
      logs: []
    };

    setHabits([...habits, newHabit]);
    setNewHabitTitle('');
    setNewHabitNiyyah('');
    setView('dashboard');
  };

  const deleteHabit = (id: string) => {
    if (confirm(t('habit_delete_confirm'))) {
      setHabits(habits.filter(h => h.id !== id));
      setView('dashboard');
    }
  };

  const initiateLog = (habit: Habit, status: 'success' | 'fail') => {
    setSelectedHabit(habit);
    setLogStatus(status);
    setReflection('');
    setSelectedTags([]);
    setAiAdvice('');
    setIsLogging(true);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const submitLog = async () => {
    if (!selectedHabit) return;

    setIsLoadingAi(true);
    
    // Combine tags into reflection for AI context
    const fullReflection = `[Feelings: ${selectedTags.join(', ')}] ${reflection}`;

    // 1. Get AI Advice with Language Context
    const advice = await getHabitAdvice(
      selectedHabit, 
      fullReflection, 
      logStatus === 'success',
      language
    );
    
    setAiAdvice(advice);
    setIsLoadingAi(false);

    // 2. Update Habit Data
    const today = new Date().toISOString().split('T')[0];
    const newLogs = [...selectedHabit.logs, {
      date: today,
      completed: logStatus === 'success',
      reflection: fullReflection,
      aiAdvice: advice
    }];

    // Calculate Streak
    let newStreak = selectedHabit.streak;
    if (logStatus === 'success') {
      newStreak += 1;
    } else {
      newStreak = 0; 
    }

    const updatedHabit = {
      ...selectedHabit,
      streak: newStreak,
      totalDays: logStatus === 'success' ? selectedHabit.totalDays + 1 : selectedHabit.totalDays,
      logs: newLogs
    };

    setHabits(habits.map(h => h.id === selectedHabit.id ? updatedHabit : h));
  };

  const isTodayLogged = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.logs.some(l => l.date.startsWith(today));
  };

  // --- RENDER HELPERS ---

  const renderAddView = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center mb-4">
        <button onClick={() => setView('dashboard')} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full me-3">
          <ChevronRight className="rotate-180 rtl:rotate-0" size={20} />
        </button>
        <h2 className="text-xl font-bold text-neutral-primary">{t('habit_new_title')}</h2>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">{t('habit_name')}</label>
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
              <button 
                onClick={() => setNewHabitType('build')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center ${newHabitType === 'build' ? 'bg-neutral-card shadow text-brand-forest' : 'text-neutral-400'}`}
              >
                <Leaf size={16} className="me-2" /> {t('habit_type_build')}
              </button>
              <button 
                onClick={() => setNewHabitType('quit')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center ${newHabitType === 'quit' ? 'bg-neutral-card shadow text-red-500' : 'text-neutral-400'}`}
              >
                <Shield size={16} className="me-2" /> {t('habit_type_quit')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">{t('habit_name')}</label>
            <input 
              type="text" 
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder={newHabitType === 'build' ? t('habit_name_placeholder_build') : t('habit_name_placeholder_quit')}
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-card focus:ring-2 focus:ring-brand-teal outline-none text-neutral-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">
              {t('habit_niyyah')}
              <span className="block text-[10px] font-normal normal-case text-neutral-400 mt-1">{t('habit_niyyah_help')}</span>
            </label>
            <textarea 
              value={newHabitNiyyah}
              onChange={(e) => setNewHabitNiyyah(e.target.value)}
              placeholder={t('habit_niyyah_placeholder')}
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-card focus:ring-2 focus:ring-brand-teal outline-none h-24 resize-none text-neutral-primary"
            />
          </div>

          <Button fullWidth onClick={addHabit} disabled={!newHabitTitle || !newHabitNiyyah}>
            {t('habit_start')}
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Tab Bar */}
      <div id="habit-tabs" className="flex bg-neutral-200 dark:bg-neutral-800 p-1 rounded-xl mb-4">
         <button 
           onClick={() => setActiveTab('tracker')}
           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'tracker' ? 'bg-neutral-card shadow text-brand-forest' : 'text-neutral-500'}`}
         >
           {t('habit_tab_tracker')}
         </button>
         <button 
           onClick={() => setActiveTab('journey')}
           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'journey' ? 'bg-neutral-card shadow text-brand-forest' : 'text-neutral-500'}`}
         >
           {t('habit_tab_journey')}
         </button>
      </div>

      {activeTab === 'journey' ? (
        <div className="space-y-4">
           {/* Concept Card */}
           <Card className="bg-gradient-to-br from-brand-forest to-brand-teal text-white border-none shadow-lg overflow-hidden relative">
              <div className="relative z-10">
                 <h3 className="font-bold text-lg mb-2">Beyond the 30-Day Streak</h3>
                 <p className="text-sm opacity-90 leading-relaxed mb-3">
                    The modern world tells you to build a habit in 90 days. Islam tells you to build an intention (Niyyah) for eternity. 
                 </p>
                 <p className="text-sm opacity-90 leading-relaxed">
                    Don't worship the streak. If you break it, make Tawbah and continue. Allah loves the deed that is consistent, even if small.
                 </p>
                 <div className="mt-4 flex items-center text-xs font-bold bg-white/10 rounded-full px-3 py-1 w-fit backdrop-blur-sm">
                    <Lightbulb size={14} className="me-2 fill-yellow-400 text-yellow-400" /> Concept: Istiqamah
                 </div>
              </div>
              <div className="absolute top-0 right-0 opacity-10 p-6">
                 <Leaf size={100} />
              </div>
           </Card>

           <h3 className="font-bold text-neutral-primary mt-6 mb-2 px-1">Recommended</h3>
           {RESOURCES.map(res => (
              <div key={res.id} className="bg-neutral-card p-4 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm flex items-start space-x-4 cursor-pointer hover:border-brand-mint transition-all">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${res.type === 'video' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}>
                    {res.type === 'video' ? <PlayCircle size={24} /> : <FileText size={24} />}
                 </div>
                 <div>
                    <h4 className="font-bold text-neutral-primary text-sm line-clamp-2">{res.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1">
                       {res.type === 'video' ? res.duration : res.readTime} • {res.author}
                    </p>
                 </div>
              </div>
           ))}
        </div>
      ) : (
        /* TRACKER VIEW */
        <>
          {/* Badges Strip */}
          <div className="overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
             <div className="flex space-x-3 w-max">
                {unlockedBadges.map(badge => (
                   <div 
                     key={badge.id} 
                     className={`flex flex-col items-center justify-center w-20 h-24 rounded-2xl border transition-all ${badge.locked ? 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-60' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30 shadow-sm'}`}
                   >
                      <div className={`text-2xl mb-1 ${badge.locked ? 'grayscale' : ''}`}>{badge.icon}</div>
                      <span className="text-[10px] font-bold text-center leading-tight px-1 text-neutral-600 dark:text-neutral-400">{badge.label}</span>
                      {badge.locked && <span className="mt-1"><Shield size={8} className="text-neutral-300" /></span>}
                   </div>
                ))}
             </div>
          </div>

          {/* Habit List */}
          <div id="habit-list" className="space-y-3">
            {habits.map(habit => {
              const doneToday = isTodayLogged(habit);
              return (
                <div 
                  key={habit.id} 
                  className={`bg-neutral-card p-4 rounded-2xl border shadow-sm transition-all ${doneToday ? 'border-brand-forest/30 bg-brand-mint/10 dark:bg-brand-forest/10' : 'border-neutral-100 dark:border-neutral-700'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div onClick={() => { setSelectedHabit(habit); setView('detail'); }} className="cursor-pointer">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                        {habit.type === 'build' ? <Sprout size={16} className="text-brand-forest" /> : <Shield size={16} className="text-red-500" />}
                        <h3 className="font-bold text-neutral-primary">{habit.title}</h3>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-1 italic">"{habit.niyyah}"</p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                       <div className="flex items-center text-orange-500 font-bold text-sm mb-2">
                          <Flame size={14} className="me-1 fill-current" /> {habit.streak}
                       </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  {!doneToday ? (
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button 
                        onClick={() => initiateLog(habit, 'success')}
                        className="flex-1 bg-neutral-100 dark:bg-neutral-700 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 text-neutral-600 dark:text-neutral-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center transition-colors"
                      >
                        <Check size={16} className="me-1" /> {habit.type === 'build' ? t('habit_done') : t('habit_avoided')}
                      </button>
                      <button 
                        onClick={() => initiateLog(habit, 'fail')}
                        className="flex-1 bg-neutral-100 dark:bg-neutral-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 text-neutral-600 dark:text-neutral-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center transition-colors"
                      >
                        <X size={16} className="me-1" /> {habit.type === 'build' ? t('habit_missed') : t('habit_slipped')}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-brand-forest/10 text-brand-forest py-2 rounded-xl text-xs font-bold flex items-center justify-center">
                       <Check size={16} className="me-1" /> {t('habit_recorded')}
                    </div>
                  )}
                </div>
              );
            })}
            
            {habits.length === 0 && (
              <div className="text-center py-10 text-neutral-400">
                <Sprout size={48} className="mx-auto mb-3 opacity-20" />
                <p>{t('habit_empty')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // --- IMMERSIVE WISDOM CARD MODAL ---
  const renderLogModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div 
        className={`
          w-full max-w-lg rounded-3xl overflow-hidden relative transition-all duration-500
          ${aiAdvice 
            ? 'bg-[#fdf6e3] dark:bg-[#1a1a1a] shadow-2xl border-4 border-double border-amber-400/30' 
            : 'bg-neutral-card shadow-lg'
          }
        `}
      >
        {/* CLOSE BUTTON */}
        <button 
          onClick={() => setIsLogging(false)} 
          className={`absolute top-4 right-4 z-20 p-2 rounded-full ${aiAdvice ? 'bg-amber-100 dark:bg-neutral-800 text-amber-800' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}
        >
          <X size={20} />
        </button>

        {!aiAdvice ? (
          /* STATE 1: REFLECTION INPUT */
          <div className="p-6 animate-in slide-in-from-bottom">
            <div className="text-center mb-6">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${logStatus === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-500'}`}>
                  {logStatus === 'success' ? <Check size={32} /> : <X size={32} />}
               </div>
               <h3 className="text-xl font-bold text-neutral-primary mb-1">
                 {logStatus === 'success' ? 'Alhamdulillah!' : 'Do Not Despair'}
               </h3>
               <p className="text-sm text-neutral-500">
                 {logStatus === 'success' ? 'Reflect on the blessing of this action.' : 'Every setback is a lesson. What happened?'}
               </p>
            </div>

            {/* Feeling Tags */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {FEELING_TAGS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedTags.includes(tag.label) ? 'bg-brand-forest text-white border-brand-forest' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}
                >
                  {tag.icon} {tag.label}
                </button>
              ))}
            </div>

            {/* Dynamic Label for Reflection */}
            {logStatus === 'fail' && (
               <div className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg mb-2">
                  <AlertTriangle size={14} className="me-2" /> Identify the Trigger (Environment, Ego, Stress?)
               </div>
            )}

            <textarea 
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={logStatus === 'success' 
                 ? "How did you find the strength today? (e.g., good company, early intention)" 
                 : "What led to this slip? Be honest with yourself so we can find a cure..."}
              className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-brand-teal outline-none h-32 resize-none mb-6 text-sm text-neutral-primary placeholder:text-neutral-400"
            />

            <Button 
               fullWidth 
               onClick={submitLog} 
               disabled={isLoadingAi} 
               className="relative overflow-hidden shadow-lg shadow-brand-forest/30 group"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none"></div>
              
              {isLoadingAi ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} /> Consulting Al-Tabib...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-bold tracking-wide">
                  <Sparkles size={18} className="fill-white/20" /> Reflect & Get Advice
                </span>
              )}
            </Button>
          </div>
        ) : (
          /* STATE 2: THE WISDOM CARD */
          <div className="relative animate-in zoom-in-95 duration-500 ease-out">
             {/* Texture Overlay */}
             <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none mix-blend-multiply dark:mix-blend-overlay" />
             
             {/* Decorative Header */}
             <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 w-full"></div>
             
             <div className="p-8 pt-10 text-center relative z-10 max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                   <Quote size={24} className="fill-current" />
                </div>
                
                <h3 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-6">
                   Spiritual Prescription
                </h3>

                <div className="prose prose-amber dark:prose-invert prose-p:font-serif prose-p:text-lg prose-p:leading-loose text-neutral-800 dark:text-neutral-100 mx-auto text-left whitespace-pre-wrap">
                   {aiAdvice}
                </div>

                <div className="mt-8 pt-6 border-t border-amber-200 dark:border-neutral-700">
                   <Button onClick={() => { setIsLogging(false); setAiAdvice(''); }} variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 px-8">
                      JazakAllah Khair
                   </Button>
                </div>
             </div>
             
             {/* Decorative Footer */}
             <div className="bg-gradient-to-r from-amber-600 to-amber-500 h-2 w-full"></div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-24 bg-neutral-body min-h-screen p-4">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      {view === 'dashboard' && (
         <>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center">
                  {onBack && (
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 me-2">
                      <ChevronRight className="rotate-180 rtl:rotate-0 text-neutral-600 dark:text-neutral-300" size={24} />
                    </button>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-primary">{t('habit_title')}</h2>
                    <p className="text-xs text-neutral-muted">{t('habit_subtitle')}</p>
                  </div>
               </div>
               <button 
                 id="habit-add-btn"
                 onClick={() => setView('add')} 
                 className="w-10 h-10 bg-brand-forest text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-teal transition-colors"
               >
                 <Plus size={24} />
               </button>
            </div>
            {renderDashboard()}
         </>
      )}
      
      {view === 'add' && renderAddView()}
      
      {/* Detailed View */}
      {view === 'detail' && selectedHabit && (
         <div className="space-y-6 animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-4">
               <button onClick={() => setView('dashboard')} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                  <ChevronRight className="rotate-180 rtl:rotate-0 text-neutral-600 dark:text-neutral-300" size={20} />
               </button>
               <button onClick={() => deleteHabit(selectedHabit.id)} className="text-red-400 p-2">
                  <Trash2 size={20} />
               </button>
            </div>
            
            <Card>
               <h2 className="text-2xl font-bold text-neutral-primary mb-1">{selectedHabit.title}</h2>
               <p className="text-sm text-neutral-500 mb-4 italic">"{selectedHabit.niyyah}"</p>
               
               <div className="flex space-x-4 mb-6 border-b border-neutral-100 dark:border-neutral-700 pb-6">
                  <div className="text-center flex-1">
                     <span className="block text-2xl font-bold text-brand-forest">{selectedHabit.streak}</span>
                     <span className="text-[10px] uppercase text-neutral-400">{t('habit_streak')}</span>
                  </div>
                  <div className="text-center flex-1 border-s border-neutral-100 dark:border-neutral-700">
                     <span className="block text-2xl font-bold text-neutral-700 dark:text-neutral-300">{selectedHabit.totalDays}</span>
                     <span className="text-[10px] uppercase text-neutral-400">{t('habit_total_days')}</span>
                  </div>
               </div>

               <h3 className="font-bold text-sm mb-3 text-neutral-primary">{t('habit_recent_journal')}</h3>
               <div className="space-y-3">
                  {selectedHabit.logs.slice().reverse().slice(0, 5).map((log, i) => (
                     <div key={i} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl text-sm">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-xs text-neutral-400">{new Date(log.date).toLocaleDateString()}</span>
                           {log.completed ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                        </div>
                        <p className="text-neutral-700 dark:text-neutral-300 mb-2">"{log.reflection}"</p>
                        {log.aiAdvice && (
                           <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-amber-100 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 italic leading-relaxed font-serif">
                              <span className="font-bold text-amber-600 dark:text-amber-500 not-italic block mb-1 uppercase tracking-wide text-[10px]">Advice:</span>
                              {log.aiAdvice}
                           </div>
                        )}
                     </div>
                  ))}
                  {selectedHabit.logs.length === 0 && <p className="text-xs text-neutral-400 text-center py-4">{t('habit_no_logs')}</p>}
               </div>
            </Card>
         </div>
      )}

      {isLogging && renderLogModal()}
    </div>
  );
};
