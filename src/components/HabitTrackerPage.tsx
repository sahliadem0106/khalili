/**
 * HabitTrackerPage - Habit tracking with streaks and heatmap
 */

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Plus,
    X,
    Check,
    Flame,
    Calendar,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Clock,
    BookOpen,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
    habitService,
    Habit,
    HabitStats,
    DayStatus,
    HABIT_TEMPLATES,
    HABIT_COLORS,
    HABIT_ICONS,
} from '../services/HabitService';

type View = 'today' | 'calendar' | 'stats';

interface HabitTrackerPageProps {
    onBack: () => void;
}

export const HabitTrackerPage: React.FC<HabitTrackerPageProps> = ({ onBack }) => {
    const { language, t } = useLanguage();
    const [view, setView] = useState<View>('today');
    const [habits, setHabits] = useState<Habit[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    useEffect(() => {
        setHabits(habitService.getHabits());
    }, []);

    const refreshHabits = () => {
        setHabits(habitService.getHabits());
    };

    const views: { id: View; icon: React.ReactNode; label: string; labelAr: string }[] = [
        { id: 'today', icon: <Check size={18} />, label: t('study_today'), labelAr: 'اليوم' },
        { id: 'calendar', icon: <Calendar size={18} />, label: t('study_calendar'), labelAr: 'التقويم' },
        { id: 'stats', icon: <BarChart3 size={18} />, label: t('habit_stats'), labelAr: 'الإحصائيات' },
    ];

    return (
        <div className="min-h-screen bg-brand-background">
            {/* Header */}
            <div className="bg-brand-surface/80 backdrop-blur-xl border-b border-white/5 text-neutral-900 px-4 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-neutral-400 hover:bg-white/5 hover:text-neutral-900 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    {t('habit_tracker_title')}
                    <button
                        onClick={() => setShowTemplates(true)}
                        className="p-2 text-neutral-400 hover:bg-white/5 hover:text-neutral-900 rounded-full"
                    >
                        <BookOpen size={20} />
                    </button>
                </div>

                {/* View Navigation */}
                <div className="flex space-x-1 rtl:space-x-reverse bg-black/20 p-1 rounded-xl">
                    {views.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setView(v.id)}
                            className={`flex-1 flex items-center justify-center space-x-2 rtl:space-x-reverse py-2 px-3 rounded-lg text-sm font-medium transition-all ${view === v.id
                                ? 'bg-brand-surface text-brand-primary shadow-sm'
                                : 'text-neutral-400 hover:bg-white/5'
                                }`}
                        >
                            {v.icon}
                            <span>{language === 'ar' ? v.labelAr : v.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {view === 'today' && (
                    <TodayView
                        habits={habits}
                        onRefresh={refreshHabits}
                        onAdd={() => setShowAddModal(true)}
                    />
                )}
                {view === 'calendar' && <CalendarView habits={habits} />}
                {view === 'stats' && <StatsView habits={habits} />}
            </div>

            {/* Add Habit Modal */}
            {showAddModal && (
                <AddHabitModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={refreshHabits}
                />
            )}

            {/* Templates Modal */}
            {showTemplates && (
                <TemplatesModal
                    onClose={() => setShowTemplates(false)}
                    onAdd={refreshHabits}
                />
            )}
        </div>
    );
};

// ==================== TODAY VIEW ====================

const TodayView: React.FC<{
    habits: Habit[];
    onRefresh: () => void;
    onAdd: () => void;
}> = ({ habits, onRefresh, onAdd }) => {
    const { t, language } = useLanguage();
    const [todaysHabits, setTodaysHabits] = useState<{ habit: Habit; completed: boolean }[]>([]);
    const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setTodaysHabits(habitService.getDayHabits(today));
        setProgress(habitService.getTodayProgress());
    }, [habits]);

    const toggleHabit = (habitId: string) => {
        const newState = habitService.toggleHabitLog(habitId);

        // Update local state
        setTodaysHabits(prev => prev.map(h =>
            h.habit.id === habitId ? { ...h, completed: newState } : h
        ));
        setProgress(habitService.getTodayProgress());

        // Show confetti if completed
        if (newState) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1000);
        }
    };

    return (
        <div className="space-y-4">
            {/* Progress Card */}
            <div className="bg-brand-surface/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-sm text-neutral-400">{t('today_progress')}</p>
                        <p className="text-2xl font-bold text-brand-primary">
                            {progress.completed}/{progress.total}
                        </p>
                    </div>
                    <div className="w-16 h-16 relative">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle
                                cx="18" cy="18" r="16"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="3"
                            />
                            <circle
                                cx="18" cy="18" r="16"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeDasharray={`${progress.percentage} 100`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-primary">
                            {progress.percentage}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Add Button */}
            <button
                onClick={onAdd}
                className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-neutral-400 hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
                <Plus size={18} />
                <span>{t('new_habit')}</span>
            </button>

            {/* Habits List */}
            <div className="space-y-2">
                {todaysHabits.map(({ habit, completed }) => {
                    const streak = habitService.getStreak(habit.id);

                    return (
                        <div
                            key={habit.id}
                            className={`bg-brand-surface/40 backdrop-blur-sm rounded-xl p-4 shadow-sm border transition-all ${completed ? 'border-brand-primary/30 bg-brand-primary/10' : 'border-white/5'
                                }`}
                        >
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <button
                                    onClick={() => toggleHabit(habit.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${completed
                                        ? 'bg-brand-primary text-white scale-110'
                                        : 'bg-white/5 text-neutral-400 hover:bg-brand-primary/20 hover:text-brand-primary'
                                        }`}
                                >
                                    {completed ? <Check size={18} /> : <span className="text-lg">{habit.icon || '✓'}</span>}
                                </button>

                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <p className={`font-medium ${completed ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                                            {habit.name}
                                        </p>
                                        {habit.type === 'break' && (
                                            <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/20">
                                                {t('habit_break')}
                                            </span>
                                        )}
                                    </div>
                                    {streak > 0 && (
                                        <div className="flex items-center space-x-1 rtl:space-x-reverse mt-1">
                                            <Flame size={12} className="text-brand-accent" />
                                            <span className="text-xs text-brand-accent font-medium">
                                                {streak} {t('habit_days')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {habit.reminderTime && (
                                    <div className="flex items-center text-neutral-500 text-xs">
                                        <Clock size={12} className="me-1" />
                                        {habit.reminderTime}
                                    </div>
                                )}
                            </div>

                            {habit.islamicRef && (
                                <p className="text-xs text-neutral-400 mt-2 font-arabic" dir="rtl">
                                    {habit.islamicRef}
                                </p>
                            )}
                        </div>
                    );
                })}

                {todaysHabits.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">
                        <Check size={40} className="mx-auto mb-2 opacity-50" />
                        <p>{t('no_habits_today')}</p>
                        <p className="text-sm">{t('add_habit_start')}</p>
                    </div>
                )}
            </div>

            {/* Confetti Animation */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div className="text-6xl animate-bounce">🎉</div>
                </div>
            )}
        </div>
    );
};

// ==================== CALENDAR VIEW ====================

const CalendarView: React.FC<{ habits: Habit[] }> = ({ habits }) => {
    const { language, t } = useLanguage();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [monthData, setMonthData] = useState<DayStatus[]>([]);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    useEffect(() => {
        const data = habitService.getMonthData(currentDate.getFullYear(), currentDate.getMonth());
        setMonthData(data);
    }, [currentDate, habits]);

    const monthNames = Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : language, { month: 'long' }).format(new Date(2000, i, 1))
    );

    const dayNames = Array.from({ length: 7 }, (_, i) =>
        // 2000-01-02 is a Sunday
        new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : language, { weekday: 'narrow' }).format(new Date(2000, 0, i + 2))
    );

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getColor = (percentage: number): string => {
        if (percentage === 0) return 'bg-neutral-100';
        if (percentage < 50) return 'bg-green-200';
        if (percentage < 100) return 'bg-green-400';
        return 'bg-green-600';
    };

    // Get first day of month and padding
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const paddingDays = Array(firstDayOfMonth).fill(null);

    return (
        <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-brand-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-3 shadow-sm">
                <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white">
                    <ChevronLeft size={20} />
                </button>
                <h3 className="font-bold text-neutral-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-brand-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-4 shadow-sm">
                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day, i) => (
                        <div key={i} className="text-center text-xs text-neutral-400 font-medium py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                    {paddingDays.map((_, i) => (
                        <div key={`pad-${i}`} className="aspect-square" />
                    ))}
                    {monthData.map((day, i) => (
                        <button
                            key={day.date}
                            onClick={() => setSelectedDay(day.date)}
                            className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${getColor(day.percentage)
                                } ${day.percentage === 100 ? 'text-white' : 'text-neutral-900'} ${selectedDay === day.date ? 'ring-2 ring-brand-primary ring-offset-1 ring-offset-black' : ''
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mt-4 text-xs text-neutral-400">
                    <span>{t('less_btn')}</span>
                    <div className="w-3 h-3 rounded bg-white/10" />
                    <div className="w-3 h-3 rounded bg-green-200" />
                    <div className="w-3 h-3 rounded bg-green-400" />
                    <div className="w-3 h-3 rounded bg-green-600" />
                    <span>{t('more_btn')}</span>
                </div>
            </div>

            {/* Selected Day Details */}
            {selectedDay && (
                <DayDetails
                    date={selectedDay}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </div>
    );
};

// Day Details Modal
const DayDetails: React.FC<{
    date: string;
    onClose: () => void;
}> = ({ date, onClose }) => {
    const { language, t } = useLanguage();
    const habits = habitService.getDayHabits(date);
    const dateObj = new Date(date);

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold">
                    {dateObj.toLocaleDateString(language === 'ar' ? 'ar' : 'en', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                    })}
                </h4>
                <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-2">
                {habits.map(({ habit, completed }) => (
                    <div
                        key={habit.id}
                        className="flex items-center space-x-2 rtl:space-x-reverse text-sm"
                    >
                        <span className={completed ? 'text-green-500' : 'text-neutral-300'}>
                            {completed ? '✓' : '○'}
                        </span>
                        <span className={completed ? 'text-neutral-700' : 'text-neutral-400'}>
                            {habit.name}
                        </span>
                    </div>
                ))}

                {habits.length === 0 && (
                    <p className="text-sm text-neutral-400 text-center py-2">
                        {t('no_habits_day')}
                    </p>
                )}
            </div>
        </div>
    );
};

// ==================== STATS VIEW ====================

const StatsView: React.FC<{ habits: Habit[] }> = ({ habits }) => {
    const { language, t } = useLanguage();
    const [stats, setStats] = useState<HabitStats[]>([]);

    useEffect(() => {
        setStats(habitService.getAllStats());
    }, [habits]);

    const totalCompletions = stats.reduce((acc, s) => acc + s.totalCompletions, 0);
    const avgCompletionRate = stats.length > 0
        ? Math.round(stats.reduce((acc, s) => acc + s.completionRate, 0) / stats.length)
        : 0;

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-neutral-400">{t('total_completions')}</p>
                    <p className="text-2xl font-bold text-brand-primary">{totalCompletions}</p>
                </div>
                <div className="bg-brand-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-neutral-400">{t('avg_completion')}</p>
                    <p className="text-2xl font-bold text-brand-secondary">{avgCompletionRate}%</p>
                </div>
            </div>

            {/* Per-Habit Stats */}
            <div className="space-y-2">
                {stats.map(stat => {
                    const habit = habits.find(h => h.id === stat.id);
                    return (
                        <div key={stat.id} className="bg-brand-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <span className="text-lg">{habit?.icon || '✓'}</span>
                                    <h4 className="font-medium text-neutral-900">{stat.name}</h4>
                                </div>
                                <div className="flex items-center space-x-1 rtl:space-x-reverse text-brand-accent">
                                    <Flame size={14} />
                                    <span className="text-sm font-bold">{stat.currentStreak}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                <div>
                                    <p className="text-neutral-400 text-xs">{t('current_streak')}</p>
                                    <p className="font-bold text-neutral-900">{stat.currentStreak}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs">{t('longest_streak')}</p>
                                    <p className="font-bold text-neutral-900">{stat.longestStreak}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs">{t('completion_rate')}</p>
                                    <p className="font-bold text-neutral-900">{stat.completionRate}%</p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {stats.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">
                        <BarChart3 size={40} className="mx-auto mb-2 opacity-50" />
                        <p>{t('no_stats')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==================== ADD HABIT MODAL ====================

const AddHabitModal: React.FC<{
    onClose: () => void;
    onAdd: () => void;
}> = ({ onClose, onAdd }) => {
    const { language, t } = useLanguage();
    const [name, setName] = useState('');
    const [type, setType] = useState<'build' | 'break'>('build');
    const [frequency, setFrequency] = useState<'daily' | 'custom'>('daily');
    const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
    const [reminderTime, setReminderTime] = useState('');
    const [icon, setIcon] = useState('✓');
    const [islamicRef, setIslamicRef] = useState('');

    const dayNames = Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : language, { weekday: 'short' }).format(new Date(2000, 0, i + 2))
    );

    const handleSubmit = () => {
        if (!name.trim()) return;

        habitService.addHabit({
            name: name.trim(),
            type,
            frequency,
            days: frequency === 'custom' ? days : undefined,
            reminderTime: reminderTime || undefined,
            icon,
            islamicRef: islamicRef || undefined,
        });

        onAdd();
        onClose();
    };

    const toggleDay = (day: number) => {
        setDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col">
                <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                    <h3 className="font-bold">{t('new_habit')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Name */}
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('habit_name')}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        autoFocus
                    />

                    {/* Type */}
                    <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={() => setType('build')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'build' ? 'bg-green-500 text-white' : 'bg-neutral-100 text-neutral-600'
                                }`}
                        >
                            {t('habit_build')} ✓
                        </button>
                        <button
                            onClick={() => setType('break')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'break' ? 'bg-red-500 text-white' : 'bg-neutral-100 text-neutral-600'
                                }`}
                        >
                            {t('habit_break')} ✕
                        </button>
                    </div>

                    {/* Frequency */}
                    <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={() => setFrequency('daily')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${frequency === 'daily' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                                }`}
                        >
                            {t('habit_daily')}
                        </button>
                        <button
                            onClick={() => setFrequency('custom')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${frequency === 'custom' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                                }`}
                        >
                            {t('specific_days')}
                        </button>
                    </div>

                    {/* Days Selection */}
                    {frequency === 'custom' && (
                        <div className="flex justify-between gap-1">
                            {dayNames.map((day, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleDay(i)}
                                    className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${days.includes(i)
                                        ? 'bg-green-500 text-white'
                                        : 'bg-neutral-100 text-neutral-600'
                                        }`}
                                >
                                    {day.slice(0, 1)}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Icon Selection */}
                    <div>
                        <p className="text-sm text-neutral-500 mb-2">{t('icon_label')}</p>
                        <div className="flex flex-wrap gap-2">
                            {HABIT_ICONS.map(ic => (
                                <button
                                    key={ic}
                                    onClick={() => setIcon(ic)}
                                    className={`w-9 h-9 rounded-lg text-lg transition-all ${icon === ic ? 'bg-green-100 scale-110' : 'bg-neutral-100'
                                        }`}
                                >
                                    {ic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reminder Time */}
                    <div>
                        <p className="text-sm text-neutral-500 mb-2">{t('reminder_time')}</p>
                        <input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                    </div>

                    {/* Islamic Reference */}
                    <div>
                        <p className="text-sm text-neutral-500 mb-2">{t('islamic_ref')}</p>
                        <input
                            type="text"
                            value={islamicRef}
                            onChange={(e) => setIslamicRef(e.target.value)}
                            placeholder={t('verse_hadith_opt')}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 font-arabic"
                        />
                    </div>
                </div>

                <div className="p-4 border-t flex-shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="w-full py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                        {t('add_habit_btn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== TEMPLATES MODAL ====================

const TemplatesModal: React.FC<{
    onClose: () => void;
    onAdd: () => void;
}> = ({ onClose, onAdd }) => {
    const { language, t } = useLanguage();

    const handleAddTemplate = (template: typeof HABIT_TEMPLATES[0]) => {
        habitService.addHabitFromTemplate(template);
        onAdd();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col">
                <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                    <h3 className="font-bold">{t('habit_templates')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    {HABIT_TEMPLATES.map((template, i) => (
                        <div
                            key={i}
                            className="bg-neutral-50 rounded-xl p-3 flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <span className="text-xl">{template.icon}</span>
                                <div>
                                    <p className="font-medium text-sm">{template.name}</p>
                                    <p className="text-xs text-neutral-400">
                                        {template.frequency === 'daily'
                                            ? (t('habit_daily'))
                                            : template.days?.map(d => new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : language, { weekday: 'short' }).format(new Date(2000, 0, d + 2))).join(', ')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAddTemplate(template)}
                                className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-neutral-100 rounded-lg font-medium"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
