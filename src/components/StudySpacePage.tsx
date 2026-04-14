/**
 * StudySpacePage - Main Study Space container with tabs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    BookOpen,
    CheckSquare,
    Calendar,
    Clock,
    StickyNote,
    Layers,
    Plus,
    ArrowLeft,
    X,
    Trash2,
    Play,
    Pause,
    RotateCcw,
    Search,
    Square,
    Settings,
    Maximize2,
    Minimize2,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    studyService,
    Subject,
    Task,
    Note,
    Deck,
    Card,
    FocusSession,
    DEFAULT_COLORS,
    DEFAULT_TIMER_SETTINGS,
    StreakSettings,
} from '../services/StudyService';

type Tab = 'tasks' | 'calendar' | 'timer' | 'notes' | 'flashcards';

interface StudySpacePageProps {
    onBack: () => void;
}

export const StudySpacePage: React.FC<StudySpacePageProps> = ({ onBack }) => {
    const { language, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<Tab>('tasks');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [showSubjectModal, setShowSubjectModal] = useState(false);

    // Dashboard stats
    const [taskStats, setTaskStats] = useState({ done: 0, total: 0 });
    const [todayFocus, setTodayFocus] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [streakSettings, setStreakSettings] = useState<StreakSettings>(() => studyService.getStreakSettings());
    const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);
    const [showTotalMinutes, setShowTotalMinutes] = useState(false);

    // Function to refresh stats - wrapped in useCallback to prevent infinite re-renders
    const refreshStats = useCallback(() => {
        // Calculate task stats
        const tasks = studyService.getTasks();
        const done = tasks.filter(t => t.done).length;
        setTaskStats({ done, total: tasks.length });

        // Get today's focus time
        setTodayFocus(studyService.getTodayFocusTime());

        // Calculate streak using goal threshold
        const settings = studyService.getStreakSettings();
        const goalMinutes = settings.dailyGoalMinutes;
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const year = checkDate.getFullYear();
            const month = String(checkDate.getMonth() + 1).padStart(2, '0');
            const day = String(checkDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const dayMinutes = studyService.getDayFocusTime(dateStr);
            const meetsGoal = dayMinutes >= goalMinutes;

            if (meetsGoal) {
                currentStreak++;
            } else if (i > 0) {
                // Allow today to not meet goal yet
                break;
            }
        }
        setStreak(currentStreak);

        // Refresh analytics
        setAnalyticsRefreshKey(k => k + 1);
    }, []);

    // Load data initially and set up live updates
    useEffect(() => {
        setSubjects(studyService.getSubjects());
        refreshStats();

        // Update stats every 30 seconds for live updates
        const interval = setInterval(refreshStats, 30000);
        return () => clearInterval(interval);
    }, []);

    // Refresh stats when switching tabs
    useEffect(() => {
        refreshStats();
    }, [activeTab]);

    const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
        { id: 'tasks', icon: <CheckSquare size={20} />, label: 'Tasks', labelAr: 'المهام' },
        { id: 'calendar', icon: <Calendar size={20} />, label: 'Calendar', labelAr: 'التقويم' },
        { id: 'timer', icon: <Clock size={20} />, label: 'Timer', labelAr: 'المؤقت' },
        { id: 'notes', icon: <StickyNote size={20} />, label: 'Notes', labelAr: 'الملاحظات' },
        { id: 'flashcards', icon: <Layers size={20} />, label: 'Cards', labelAr: 'البطاقات' },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-brand-background pb-20">
            {/* Header */}
            <div className="bg-white/80 dark:bg-brand-surface/80 backdrop-blur-xl border-b border-neutral-200 dark:border-white/5 px-4 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-neutral-500 dark:text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 dark:text-white">
                        {t('study_space')}
                    </h1>
                    {/* Empty placeholder to maintain header layout */}
                    <div className="w-9" />
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 rtl:space-x-reverse bg-neutral-100 dark:bg-neutral-100 dark:bg-black/20 p-1 rounded-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-brand-surface shadow-sm text-brand-primary'
                                : 'text-neutral-500 dark:text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/5'
                                }`}
                        >
                            {tab.icon}
                            <span className="mt-1">{language === 'ar' ? tab.labelAr : tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Dashboard Summary */}
            <div className="px-4 pt-4">
                <div className="grid grid-cols-3 gap-3">
                    {/* Tasks Counter */}
                    <div className="bg-white dark:bg-brand-surface/40 backdrop-blur-sm rounded-xl p-3 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-lg mb-2">
                            <CheckSquare size={16} className="text-green-500 dark:text-green-400" />
                        </div>
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-900 dark:text-white">{taskStats.total - taskStats.done}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 dark:text-neutral-400">{t('study_remaining' as any)}</p>
                    </div>

                    {/* Focus Time */}
                    {/* Focus Time - Clickable to toggle format */}
                    <button
                        onClick={() => setShowTotalMinutes(!showTotalMinutes)}
                        className="bg-white dark:bg-brand-surface/40 backdrop-blur-sm rounded-xl p-3 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none hover:border-blue-400 transition-colors text-left"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg mb-2">
                            <Clock size={16} className="text-blue-500 dark:text-blue-400" />
                        </div>
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-900 dark:text-white">
                            {showTotalMinutes
                                ? `${Math.floor(todayFocus)}m`
                                : `${Math.floor(todayFocus / 60)}h ${todayFocus % 60}m`
                            }
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 dark:text-neutral-400">{t('study_today')}</p>
                    </button>

                    {/* Streak - Clickable to set goal */}
                    <button
                        onClick={() => setShowStreakModal(true)}
                        className="bg-white dark:bg-brand-surface/40 backdrop-blur-sm rounded-xl p-3 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none hover:border-orange-400 transition-colors text-left"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-orange-500/20 rounded-lg mb-2">
                            <span className="text-orange-400">🔥</span>
                        </div>
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-900 dark:text-white">{streak}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 dark:text-neutral-400">{t('study_streak')}</p>
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 space-y-4">
                {activeTab === 'tasks' && <TasksTab subjects={subjects} />}
                {activeTab === 'calendar' && <CalendarTab subjects={subjects} />}
                {activeTab === 'timer' && <TimerTab subjects={subjects} onSessionSaved={refreshStats} refreshKey={analyticsRefreshKey} />}
                {activeTab === 'notes' && <NotesTab subjects={subjects} />}
                {activeTab === 'flashcards' && <FlashcardsTab subjects={subjects} />}
            </div>

            {/* Floating Action Button - Add Subject */}
            <button
                onClick={() => setShowSubjectModal(true)}
                className="fixed bottom-24 left-4 rtl:left-auto rtl:right-4 z-50 w-14 h-14 bg-brand-primary text-neutral-900 dark:text-white rounded-full shadow-xl shadow-brand-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                title={t('study_add_subject') as string}
            >
                <Plus size={24} />
            </button>

            {/* Subject Manager Modal */}
            {showSubjectModal && (
                <SubjectManagerModal
                    subjects={subjects}
                    onClose={() => setShowSubjectModal(false)}
                    onUpdate={(updated) => setSubjects(updated)}
                />
            )}

            {/* Streak Settings Modal */}
            {showStreakModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-brand-surface w-full max-w-sm rounded-2xl shadow-glass border border-neutral-200 dark:border-white/10">
                        <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                {t('study_streak_settings')}
                            </h3>
                            <button onClick={() => setShowStreakModal(false)} className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                {language === 'ar'
                                    ? 'حدد الحد الأدنى لوقت الدراسة اليومي لاحتسابه كيوم سلسلة'
                                    : 'Set the minimum daily study time to count as a streak day'
                                }
                            </p>
                            <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
                                <div className="text-center">
                                    <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
                                        {t('study_hours')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="12"
                                        value={Math.floor(streakSettings.dailyGoalMinutes / 60)}
                                        onChange={(e) => {
                                            const hours = parseInt(e.target.value) || 0;
                                            const mins = streakSettings.dailyGoalMinutes % 60;
                                            setStreakSettings({ dailyGoalMinutes: hours * 60 + mins });
                                        }}
                                        className="w-20 text-center text-xl font-bold bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl p-3 text-neutral-900 dark:text-white"
                                    />
                                </div>
                                <span className="text-2xl font-bold text-neutral-400">:</span>
                                <div className="text-center">
                                    <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
                                        {t('study_minutes')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        step="5"
                                        value={streakSettings.dailyGoalMinutes % 60}
                                        onChange={(e) => {
                                            const hours = Math.floor(streakSettings.dailyGoalMinutes / 60);
                                            const mins = parseInt(e.target.value) || 0;
                                            setStreakSettings({ dailyGoalMinutes: hours * 60 + mins });
                                        }}
                                        className="w-20 text-center text-xl font-bold bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl p-3 text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                                {language === 'ar'
                                    ? `الهدف الحالي: ${Math.floor(streakSettings.dailyGoalMinutes / 60)}س ${streakSettings.dailyGoalMinutes % 60}د`
                                    : `Current goal: ${Math.floor(streakSettings.dailyGoalMinutes / 60)}h ${streakSettings.dailyGoalMinutes % 60}m`
                                }
                            </p>
                            <button
                                onClick={() => {
                                    studyService.saveStreakSettings(streakSettings);
                                    refreshStats();
                                    setShowStreakModal(false);
                                }}
                                className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                            >
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==================== SUBJECT MANAGER MODAL ====================

interface SubjectManagerModalProps {
    subjects: Subject[];
    onClose: () => void;
    onUpdate: (subjects: Subject[]) => void;
}

const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({ subjects, onClose, onUpdate }) => {
    const { language, t } = useLanguage();
    const [newName, setNewName] = useState('');
    const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);

    const handleAdd = () => {
        if (!newName.trim()) return;
        studyService.addSubject(newName.trim(), selectedColor);
        onUpdate(studyService.getSubjects());
        setNewName('');
        setSelectedColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    };

    const handleDelete = (id: string) => {
        studyService.deleteSubject(id);
        onUpdate(studyService.getSubjects());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-brand-surface w-full max-w-sm rounded-2xl shadow-glass border border-white/10">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-neutral-900 dark:text-white">{t('study_subjects')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-neutral-500 dark:text-neutral-400">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Add New */}
                    <div className="flex space-x-2 rtl:space-x-reverse">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('study_subject_name') as string}
                            className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 placeholder-neutral-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            className="px-4 py-2 bg-brand-primary text-neutral-900 dark:text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-primary/90"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Color Picker */}
                    <div className="flex flex-wrap gap-2">
                        {DEFAULT_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-7 h-7 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-brand-primary scale-110 ring-offset-brand-surface' : 'opacity-80 hover:opacity-100'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    {/* Subject List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {subjects.map(subject => (
                            <div
                                key={subject.id}
                                className="flex items-center justify-between p-2 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5"
                            >
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: subject.color }} />
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{subject.name}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(subject.id)}
                                    className="p-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 rounded"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {subjects.length === 0 && (
                            <p className="text-center text-neutral-500 text-sm py-4">
                                {t('study_no_subjects')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== TASKS TAB ====================

const TasksTab: React.FC<{ subjects: Subject[] }> = ({ subjects }) => {
    const { language, t } = useLanguage();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
    const [subjectFilter, setSubjectFilter] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        setTasks(studyService.getTasks());
    }, []);

    const getFilteredTasks = () => {
        let filtered = tasks;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        if (filter === 'today') {
            filtered = filtered.filter(t => {
                const due = new Date(t.dueDate);
                return due >= today && due < new Date(today.getTime() + 86400000);
            });
        } else if (filter === 'week') {
            filtered = filtered.filter(t => {
                const due = new Date(t.dueDate);
                return due >= today && due < weekEnd;
            });
        }

        if (subjectFilter) {
            filtered = filtered.filter(t => t.subject === subjectFilter);
        }

        return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    };

    const toggleTask = (id: string) => {
        studyService.toggleTask(id);
        setTasks(studyService.getTasks());
    };

    const deleteTask = (id: string) => {
        studyService.deleteTask(id);
        setTasks(studyService.getTasks());
    };

    const priorityColors = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        low: 'bg-green-100 text-green-700 border-green-200',
    };

    const filteredTasks = getFilteredTasks();

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
                <div className="flex space-x-1 rtl:space-x-reverse bg-neutral-100 dark:bg-black/20 p-1 rounded-lg">
                    {(['today', 'week', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-neutral-500 dark:text-neutral-400'
                                }`}
                        >
                            {f === 'today' && t('study_today')}
                            {f === 'week' && t('study_week')}
                            {f === 'all' && t('study_all')}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1.5 bg-brand-primary text-neutral-900 dark:text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90"
                >
                    <Plus size={16} />
                    <span>{t('study_task')}</span>
                </button>
            </div>

            {/* Subject Filter */}
            {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSubjectFilter('')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!subjectFilter ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/5 text-neutral-500 dark:text-neutral-400'
                            }`}
                    >
                        {t('study_all')}
                    </button>
                    {subjects.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSubjectFilter(s.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border`}
                            style={{
                                backgroundColor: subjectFilter === s.id ? s.color + '20' : 'transparent',
                                borderColor: s.color,
                                color: s.color,
                            }}
                        >
                            {s.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Task List */}
            <div className="space-y-2">
                {filteredTasks.map(task => {
                    const subject = subjects.find(s => s.id === task.subject);
                    return (
                        <div
                            key={task.id}
                            className={`bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5 ${task.done ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                <button
                                    onClick={() => toggleTask(task.id)}
                                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.done
                                        ? 'bg-green-500 border-green-500 text-neutral-900 dark:text-white'
                                        : 'border-neutral-500 hover:border-brand-primary'
                                        }`}
                                >
                                    {task.done && <span className="text-xs">✓</span>}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-sm ${task.done ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                                        {subject && (
                                            <span
                                                className="px-2 py-0.5 rounded text-xs"
                                                style={{ backgroundColor: subject.color + '20', color: subject.color }}
                                            >
                                                {subject.name}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded text-xs border ${priorityColors[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-1 text-neutral-600 dark:text-neutral-300 hover:text-red-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredTasks.length === 0 && (
                    <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                        <CheckSquare size={40} className="mx-auto mb-2 opacity-50" />
                        <p>{t('study_no_tasks')}</p>
                    </div>
                )}
            </div>

            {/* Add Task Modal */}
            {showAddModal && (
                <AddTaskModal
                    subjects={subjects}
                    onClose={() => setShowAddModal(false)}
                    onAdd={() => setTasks(studyService.getTasks())}
                />
            )}
        </div>
    );
};

// Add Task Modal
const AddTaskModal: React.FC<{
    subjects: Subject[];
    onClose: () => void;
    onAdd: () => void;
}> = ({ subjects, onClose, onAdd }) => {
    const { language, t } = useLanguage();
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        if (!title.trim()) return;
        studyService.addTask({
            title: title.trim(),
            subject,
            dueDate: new Date(dueDate),
            priority,
            done: false,
            notes: notes.trim() || undefined,
        });
        onAdd();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-brand-surface w-full max-w-sm rounded-2xl shadow-glass border border-white/10 max-h-[90vh] overflow-y-auto">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 bg-brand-surface">
                    <h3 className="font-bold text-neutral-900 dark:text-white">{t('study_new_task')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-neutral-500 dark:text-neutral-400">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('study_task_title') as string}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-neutral-900 dark:text-white placeholder-neutral-500"
                        autoFocus
                    />

                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-neutral-900 dark:text-white"
                    >
                        <option value="" className="bg-brand-surface">{t('study_select_subject')}</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id} className="bg-brand-surface">{s.name}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-neutral-900 dark:text-white scheme-dark"
                    />

                    {/* Priority Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            {t('study_priority')}
                        </label>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                            {(['low', 'medium', 'high'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${priority === p
                                        ? p === 'high' ? 'bg-red-500 text-neutral-900 dark:text-white'
                                            : p === 'medium' ? 'bg-yellow-500 text-neutral-900 dark:text-white'
                                                : 'bg-green-500 text-neutral-900 dark:text-white'
                                        : 'bg-white/5 text-neutral-500 dark:text-neutral-400 hover:bg-white/10'
                                        }`}
                                >
                                    {p === 'high' && t('study_high')}
                                    {p === 'medium' && t('study_medium')}
                                    {p === 'low' && t('study_low')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            {t('study_details')}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('study_details_placeholder') as string}
                            className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-neutral-900 dark:text-white placeholder-neutral-500 h-20 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        className="w-full py-3 bg-brand-primary text-neutral-900 dark:text-white rounded-lg font-medium disabled:opacity-50 hover:bg-brand-primary/90"
                    >
                        {t('study_add_task')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== CALENDAR TAB ====================

const CalendarTab: React.FC<{ subjects: Subject[] }> = ({ subjects }) => {
    const { language, t } = useLanguage();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sessions, setSessions] = useState<FocusSession[]>([]);

    useEffect(() => {
        setTasks(studyService.getTasks());
        setSessions(studyService.getFocusSessions());
    }, []);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = language === 'ar'
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayNames = language === 'ar'
        ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Helper to get local date string (YYYY-MM-DD) without timezone issues
    const toLocalDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDateStr = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return toLocalDateStr(date);
    };

    const getTasksForDay = (day: number) => {
        const dateStr = getDateStr(day);
        return tasks.filter(t => {
            const taskDate = new Date(t.dueDate);
            return toLocalDateStr(taskDate) === dateStr;
        });
    };

    const getSessionsForDay = (day: number) => {
        const dateStr = getDateStr(day);
        return sessions.filter(s => s.date === dateStr);
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    const selectedTasks = selectedDate ? tasks.filter(t => {
        const taskDate = new Date(t.dueDate);
        return toLocalDateStr(taskDate) === toLocalDateStr(selectedDate);
    }) : [];

    const selectedSessions = selectedDate ? sessions.filter(s =>
        s.date === toLocalDateStr(selectedDate)
    ) : [];

    return (
        <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5">
                <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-neutral-500 dark:text-neutral-400">
                    <ArrowLeft size={18} />
                </button>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-neutral-500 dark:text-neutral-400">
                    <ArrowLeft size={18} className="rotate-180" />
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayTasks = getTasksForDay(day);
                    const daySessions = getSessionsForDay(day);
                    const hasEvents = dayTasks.length > 0 || daySessions.length > 0;
                    const today = isToday(day);

                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative ${today
                                ? 'bg-brand-primary text-neutral-900 dark:text-white font-bold'
                                : hasEvents
                                    ? 'bg-brand-surface/60 text-neutral-900 dark:text-white hover:bg-brand-surface'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-white/5'
                                }`}
                        >
                            {day}
                            {/* Event Indicators */}
                            {hasEvents && (
                                <div className="flex space-x-0.5 absolute bottom-1">
                                    {dayTasks.length > 0 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                    )}
                                    {daySessions.length > 0 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected Day Details */}
            {selectedDate && (
                <div className="bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-neutral-900 dark:text-white">
                            {selectedDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </h4>
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="p-1 hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Tasks */}
                    {selectedTasks.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                {t('study_tasks')}
                            </p>
                            {selectedTasks.map(task => {
                                const subject = subjects.find(s => s.id === task.subject);
                                return (
                                    <div key={task.id} className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                                        <div className={`w-2 h-2 rounded-full ${task.done ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                        <span className={task.done ? 'line-through text-neutral-500' : 'text-neutral-900 dark:text-white'}>{task.title}</span>
                                        {subject && (
                                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: subject.color + '20', color: subject.color }}>
                                                {subject.name}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Sessions */}
                    {selectedSessions.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                {t('study_focus_sessions')}
                            </p>
                            {selectedSessions.map(session => {
                                const subject = subjects.find(s => s.id === session.subject);
                                return (
                                    <div key={session.id} className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                        <span className="text-neutral-900 dark:text-white">{session.duration} min</span>
                                        {subject && (
                                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: subject.color + '20', color: subject.color }}>
                                                {subject.name}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {selectedTasks.length === 0 && selectedSessions.length === 0 && (
                        <p className="text-neutral-500 text-sm text-center py-2">
                            {t('study_no_events')}
                        </p>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span>{t('study_tasks')}</span>
                </div>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span>{t('study_sessions')}</span>
                </div>
            </div>
        </div>
    );
};

// ==================== WEEKLY ANALYTICS ====================

const WeeklyAnalytics: React.FC<{ subjects: Subject[]; language: string; refreshKey?: number }> = ({ subjects, language, refreshKey }) => {
    const [weekData, setWeekData] = useState<{ day: string; minutes: number }[]>([]);
    const [subjectData, setSubjectData] = useState<{ id: string; name: string; color: string; minutes: number }[]>([]);
    const { t } = useLanguage();

    useEffect(() => {
        const sessions = studyService.getFocusSessions();

        // Use current date as anchor without modifying time to avoid timezone shifts affecting ISO date
        const today = new Date();

        // Get last 7 days
        const days: { day: string; minutes: number; label: string }[] = [];
        const dayLabels = language === 'ar'
            ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayMinutes = sessions
                .filter(s => s.date === dateStr)
                .reduce((acc, s) => acc + s.duration, 0);
            days.push({
                day: dayLabels[date.getDay()],
                minutes: dayMinutes,
                label: dateStr,
            });
        }
        setWeekData(days);

        // Subject breakdown
        const subjectMinutes: Record<string, number> = {};
        sessions.forEach(s => {
            const subId = s.subject || 'General';
            subjectMinutes[subId] = (subjectMinutes[subId] || 0) + s.duration;
        });

        const subjectStats = Object.entries(subjectMinutes).map(([id, minutes]) => {
            const subject = subjects.find(s => s.id === id);
            return {
                id,
                name: subject?.name || t('study_general') as string,
                color: subject?.color || '#6B7280',
                minutes,
            };
        }).sort((a, b) => b.minutes - a.minutes).slice(0, 5);

        setSubjectData(subjectStats);
    }, [subjects, language, refreshKey]);

    const maxMinutes = Math.max(...weekData.map(d => d.minutes), 1);
    const totalWeek = weekData.reduce((acc, d) => acc + d.minutes, 0);

    // State to track selected day for showing details
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            {/* Weekly Chart */}
            <div className="bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                        {t('study_this_week')}
                    </h4>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {Math.floor(totalWeek / 60)}h {totalWeek % 60}m
                    </span>
                </div>
                <div className="flex items-end justify-between h-24 gap-1">
                    {weekData.map((d, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                            className="flex-1 flex flex-col items-center group relative focus:outline-none"
                        >
                            {/* Tooltip */}
                            {(selectedDay === i) && (
                                <div className="absolute bottom-full mb-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-10">
                                    {Math.floor(d.minutes / 60)}h {d.minutes % 60}m
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-white"></div>
                                </div>
                            )}

                            <div className="w-full flex flex-col justify-end h-20">
                                <div
                                    className="w-full bg-brand-primary/80 rounded-t transition-all"
                                    style={{ height: `${(d.minutes / maxMinutes) * 100}%`, minHeight: d.minutes > 0 ? '4px' : '0' }}
                                />
                            </div>
                            <span className="text-[10px] text-neutral-500 mt-1">{d.day}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Subject Breakdown */}
            {subjectData.length > 0 && (
                <div className="bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5">
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
                        {t('study_by_subject')}
                    </h4>
                    <div className="space-y-2">
                        {subjectData.map(s => (
                            <div key={s.id} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                <span className="flex-1 text-sm text-neutral-600 dark:text-neutral-300 truncate">{s.name}</span>
                                <span className="text-xs text-neutral-500">
                                    {Math.floor(s.minutes / 60)}h {s.minutes % 60}m
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ==================== TIMER TAB ====================

const TIMER_STATE_KEY = 'khalil_timer_state';

interface TimerState {
    startTime: number; // Unix timestamp when timer started
    mode: 'pomodoro' | 'long' | 'custom';
    subject: string;
    targetDuration: number; // seconds
    isBreak: boolean;
}

const TimerTab: React.FC<{ subjects: Subject[]; onSessionSaved?: () => void; refreshKey?: number }> = ({ subjects, onSessionSaved, refreshKey }) => {
    const { language, t } = useLanguage();
    const [mode, setMode] = useState<'pomodoro' | 'long' | 'custom'>('pomodoro');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
    const [isBreak, setIsBreak] = useState(false);
    const [todayTotal, setTodayTotal] = useState(0);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customSettings, setCustomSettings] = useState({ work: 45, break: 15 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Load saved settings
    const [settings, setSettings] = useState(DEFAULT_TIMER_SETTINGS);

    useEffect(() => {
        setTodayTotal(studyService.getTodayFocusTime());
        const savedSettings = studyService.getTimerSettings();
        setSettings(savedSettings);

        // Sync custom modal inputs with saved settings
        if (savedSettings.custom) {
            setCustomSettings(savedSettings.custom);
        }

        // Restore timer state from localStorage
        const savedState = localStorage.getItem(TIMER_STATE_KEY);
        if (savedState) {
            try {
                const state: TimerState = JSON.parse(savedState);
                const now = Date.now();
                const elapsed = Math.floor((now - state.startTime) / 1000);
                const remaining = state.targetDuration - elapsed;

                if (remaining > 0) {
                    // Timer is still running - mark as restored to prevent reset
                    restoredRef.current = true;
                    startTimeRef.current = state.startTime;
                    setMode(state.mode);
                    setSelectedSubject(state.subject);
                    setIsBreak(state.isBreak);
                    setTimeLeft(remaining);
                    setIsRunning(true);
                } else {
                    // Timer expired while away
                    localStorage.removeItem(TIMER_STATE_KEY);
                    if (!state.isBreak) {
                        // Save the completed session
                        const duration = state.targetDuration / 60;
                        studyService.addFocusSession(state.subject || 'General', Math.floor(duration));
                        setTodayTotal(studyService.getTodayFocusTime());
                        onSessionSaved?.(); // Refresh parent stats and charts
                    }
                }
            } catch (e) {
                localStorage.removeItem(TIMER_STATE_KEY);
            }
        }
    }, [onSessionSaved]);

    // Track if we just restored (to prevent mode reset from overriding)
    const restoredRef = React.useRef(false);
    const startTimeRef = React.useRef<number | null>(null);

    // Save timer state when running - use ref to track start time
    useEffect(() => {
        if (isRunning && startTimeRef.current) {
            const state: TimerState = {
                startTime: startTimeRef.current,
                mode,
                subject: selectedSubject,
                targetDuration: isBreak ? settings[mode].break * 60 : settings[mode].work * 60,
                isBreak,
            };
            localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
        }
    }, [isRunning, mode, selectedSubject, isBreak, settings]);

    useEffect(() => {
        // Skip reset if we just restored from saved state
        if (restoredRef.current) {
            restoredRef.current = false;
            return;
        }
        const workTime = settings[mode].work * 60;
        setTimeLeft(workTime);
        setIsRunning(false);
        setIsBreak(false);
        localStorage.removeItem(TIMER_STATE_KEY);
        startTimeRef.current = null;
    }, [mode, settings]);

    // Timer tick effect - PURE STATE UPDATE ONLY
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    // Timer completion effect - HANDLES SIDE EFFECTS
    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            // Timer finished naturally
            setIsRunning(false);
            localStorage.removeItem(TIMER_STATE_KEY);

            if (!isBreak) {
                // Focus session finished
                const duration = settings[mode].work;
                console.log(`[Timer] Focus finished. Duration: ${duration}m`);

                // Save session
                studyService.addFocusSession(selectedSubject || 'General', duration);
                setTodayTotal(studyService.getTodayFocusTime());

                // Call callback after state update
                setTimeout(() => onSessionSaved?.(), 0);

                // Start break automatically
                setIsBreak(true);
                setTimeLeft(settings[mode].break * 60);
                // Optionally auto-start break? Here we stop it.
                // If we want to auto-start break, we would set isRunning(true) here.
                // But typically we stop. User clicks start for break.
            } else {
                // Break finished
                console.log(`[Timer] Break finished.`);
                setIsBreak(false);
                setTimeLeft(settings[mode].work * 60);
            }
        }
    }, [timeLeft, isRunning, isBreak, mode, settings, selectedSubject, onSessionSaved]);

    // Save elapsed time when app is closed or navigated away
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Only save if timer is RUNNING (not paused) and not on break
            if (isRunning && !isBreak) {
                const targetDuration = settings[mode].work * 60;
                const elapsedSeconds = targetDuration - timeLeft;
                const elapsedMinutes = Math.floor(elapsedSeconds / 60);

                if (elapsedMinutes > 0) {
                    studyService.addFocusSession(selectedSubject || 'General', elapsedMinutes);
                }
                // Clear timer state since we saved
                localStorage.removeItem(TIMER_STATE_KEY);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
        };
    }, [isRunning, isBreak, mode, settings, timeLeft, selectedSubject]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const reset = () => {
        setIsRunning(false);
        setIsBreak(false);
        setTimeLeft(settings[mode].work * 60);
        localStorage.removeItem(TIMER_STATE_KEY);
        startTimeRef.current = null;
    };

    const handleToggle = () => {
        if (!isRunning) {
            // Starting timer - save state with current timestamp
            const now = Date.now();
            startTimeRef.current = now;
            const state: TimerState = {
                startTime: now,
                mode,
                subject: selectedSubject,
                targetDuration: isBreak ? settings[mode].break * 60 : timeLeft,
                isBreak,
            };
            localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
        } else {
            // Pausing timer - clear state
            localStorage.removeItem(TIMER_STATE_KEY);
            startTimeRef.current = null;
        }
        setIsRunning(!isRunning);
    };

    // Stop session and save elapsed time to today's total
    const stopSession = () => {
        if (!isBreak) {
            // Calculate elapsed time in minutes
            const targetDuration = settings[mode].work * 60;
            const elapsedSeconds = targetDuration - timeLeft;
            const elapsedMinutes = Math.floor(elapsedSeconds / 60);

            if (elapsedMinutes > 0) {
                // Save partial session
                studyService.addFocusSession(selectedSubject || 'General', elapsedMinutes);
                setTodayTotal(studyService.getTodayFocusTime());
                onSessionSaved?.(); // Refresh parent stats and charts
            }
        }
        // Reset timer
        setIsRunning(false);
        setIsBreak(false);
        setTimeLeft(settings[mode].work * 60);
        localStorage.removeItem(TIMER_STATE_KEY);
        startTimeRef.current = null;
    };

    const saveCustomSettings = (work: number, breakTime: number) => {
        const newSettings = { ...settings, custom: { work, break: breakTime } };
        setSettings(newSettings);
        studyService.saveTimerSettings(newSettings);
        setShowCustomModal(false);
        if (mode === 'custom') {
            setTimeLeft(work * 60);
        }
    };

    return (
        <>
            {/* Fullscreen Mode Overlay */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
                    {/* Minimize Button */}
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <Minimize2 size={24} className="text-white" />
                    </button>

                    {/* Timer Display - Centered */}
                    <div className="text-center">
                        <p className={`text-xl font-medium mb-4 ${isBreak ? 'text-green-400' : 'text-white/70'}`}>
                            {isBreak
                                ? t('study_break_time')
                                : t('study_focus_time')}
                        </p>
                        <div className={`text-[12rem] font-mono font-bold tracking-tight leading-none ${isBreak ? 'text-green-400' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        {selectedSubject && (
                            <p className="text-white/50 text-lg mt-4">
                                {subjects.find(s => s.id === selectedSubject)?.name || t('study_general')}
                            </p>
                        )}
                    </div>

                    {/* Controls - Bottom */}
                    <div className="absolute bottom-12 flex items-center gap-6">
                        <button
                            onClick={reset}
                            className="p-5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                            title={t('study_reset') as string}
                        >
                            <RotateCcw size={28} className="text-white/70" />
                        </button>

                        <button
                            onClick={handleToggle}
                            className={`p-8 rounded-full transition-all ${isRunning ? 'bg-white/20 hover:bg-white/30' : 'bg-white hover:bg-white/90'}`}
                        >
                            {isRunning ? (
                                <Pause size={40} className="text-white" />
                            ) : (
                                <Play size={40} className="text-black ms-1" />
                            )}
                        </button>

                        <button
                            onClick={stopSession}
                            className="p-5 bg-red-500/30 rounded-full hover:bg-red-500/40 transition-colors"
                            title={language === 'ar' ? 'إيقاف وحفظ' : 'Stop & Save'}
                        >
                            <Square size={24} className="text-red-400" fill="currentColor" />
                        </button>
                    </div>

                    {/* Today's Total - Top Left */}
                    <div className="absolute top-6 left-6 text-left">
                        <p className="text-white/40 text-sm">{t('study_todays_total')}</p>
                        <p className="text-2xl font-bold text-white/80">
                            {Math.floor(todayTotal / 60)}h {todayTotal % 60}m
                        </p>
                    </div>
                </div>
            )}

            {/* Regular Mode */}
            <div className={`space-y-6 ${isFullscreen ? 'hidden' : ''}`}>
                {/* Fullscreen Toggle Button */}
                <button
                    onClick={() => setIsFullscreen(true)}
                    className="w-full py-3 bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-xl flex items-center justify-center gap-3 text-white/80 hover:text-white transition-colors border border-white/10"
                >
                    <Maximize2 size={20} />
                    <span className="font-medium">{t('study_fullscreen')}</span>
                </button>

                {/* Mode Selection */}
                <div className="flex space-x-2 rtl:space-x-reverse">
                    {[
                        { id: 'pomodoro', label: `${settings.pomodoro.work}/${settings.pomodoro.break}` },
                        { id: 'long', label: `${settings.long.work}/${settings.long.break}` },
                        { id: 'custom', label: `${settings.custom.work}/${settings.custom.break}`, editable: true },
                    ].map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id as 'pomodoro' | 'long' | 'custom')}
                            disabled={isRunning && mode !== m.id}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === m.id
                                ? 'bg-brand-primary text-neutral-900 dark:text-white'
                                : 'bg-white/5 text-neutral-500 dark:text-neutral-400 disabled:opacity-50 hover:bg-white/10'
                                }`}
                        >
                            <span>{m.label}</span>
                        </button>
                    ))}
                </div>

                {/* Subject Selection */}
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={isRunning}
                    className="w-full px-3 py-2 bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-neutral-900 dark:text-white"
                >
                    <option value="" className="bg-brand-surface">{t('study_general')}</option>
                    {subjects.map(s => (
                        <option key={s.id} value={s.id} className="bg-brand-surface">{s.name}</option>
                    ))}
                </select>

                {/* Timer Display */}
                <div className="bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5 rounded-3xl p-8 shadow-soft text-center">
                    <p className={`text-sm font-medium mb-2 ${isBreak ? 'text-brand-secondary' : 'text-brand-primary'}`}>
                        {isBreak
                            ? t('study_break')
                            : t('study_focus')}
                    </p>
                    <div className={`text-6xl font-mono font-bold ${isBreak ? 'text-brand-secondary' : 'text-neutral-900 dark:text-white'}`}>
                        {formatTime(timeLeft)}
                    </div>
                    {isRunning && (
                        <p className="text-xs text-green-400 mt-2 animate-pulse">
                            {language === 'ar' ? '• يعمل في الخلفية' : '• Running in background'}
                        </p>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between w-full">
                    {/* Left Side (Reset) */}
                    <div className="flex-1 flex justify-end gap-4 px-4">
                        <button
                            onClick={reset}
                            className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5 w-14 h-14 flex items-center justify-center"
                            title={t('study_reset') as string}
                        >
                            <RotateCcw size={24} className="text-neutral-500 dark:text-neutral-400" />
                        </button>
                    </div>

                    {/* Center (Play/Pause) */}
                    <div className="flex-none">
                        <button
                            onClick={handleToggle}
                            className="p-6 bg-brand-primary rounded-full hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 flex items-center justify-center"
                            title={isRunning ? (language === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (language === 'ar' ? 'ابدأ' : 'Start')}
                        >
                            {isRunning ? (
                                <Pause size={32} className="text-neutral-900 dark:text-white" />
                            ) : (
                                <Play size={32} className="text-neutral-900 dark:text-white ms-1" />
                            )}
                        </button>
                    </div>

                    {/* Right Side (Stop & Settings) */}
                    <div className="flex-1 flex justify-start gap-4 px-4">
                        <button
                            onClick={stopSession}
                            className="p-4 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors border border-red-500/30 w-14 h-14 flex items-center justify-center"
                            title={language === 'ar' ? 'إيقاف وحفظ' : 'Stop & Save'}

                        >
                            <Square size={20} className="text-red-400" fill="currentColor" />
                        </button>

                        {/* Custom Settings Button - Only show in Custom mode */}
                        {mode === 'custom' && (
                            <button
                                onClick={() => !isRunning && setShowCustomModal(true)}
                                disabled={isRunning}
                                className={`p-4 rounded-full transition-colors border w-14 h-14 flex items-center justify-center
                                ${isRunning
                                        ? 'bg-white/5 border-white/5 text-neutral-500 cursor-not-allowed opacity-50'
                                        : 'bg-white/5 border-white/5 text-neutral-400 cursor-pointer'
                                    }`}
                                title={language === 'ar' ? 'إعدادات' : 'Settings'}
                            >
                                <Settings size={22} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Today's Total */}
                <div className="bg-white dark:bg-brand-surface/20 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{language === 'ar' ? 'مجموع اليوم' : "Today's Total"}</p>
                    <p className="text-2xl font-bold text-brand-primary">
                        {Math.floor(todayTotal / 60)}h {todayTotal % 60}m
                    </p>
                </div>

                {/* Weekly Analytics */}
                <WeeklyAnalytics subjects={subjects} language={language} refreshKey={refreshKey} />

                {/* Custom Timer Modal */}
                {showCustomModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-brand-surface w-full max-w-sm rounded-2xl shadow-glass border border-white/10">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-neutral-900 dark:text-white">{t('study_customize_timer')}</h3>
                                <button onClick={() => setShowCustomModal(false)} className="p-1 hover:bg-white/10 rounded-full text-neutral-500 dark:text-neutral-400">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300 block mb-2">
                                        {t('study_work_time_min')}
                                    </label>
                                    <input
                                        type="number"
                                        value={customSettings.work}
                                        onChange={(e) => setCustomSettings({ ...customSettings, work: Math.max(1, parseInt(e.target.value) || 1) })}
                                        min={1}
                                        max={120}
                                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300 block mb-2">
                                        {t('study_break_time_min')}
                                    </label>
                                    <input
                                        type="number"
                                        value={customSettings.break}
                                        onChange={(e) => setCustomSettings({ ...customSettings, break: Math.max(1, parseInt(e.target.value) || 1) })}
                                        min={1}
                                        max={60}
                                    />
                                </div>
                                <button
                                    onClick={() => saveCustomSettings(customSettings.work, customSettings.break)}
                                    className="w-full py-3 bg-brand-primary text-neutral-900 dark:text-white rounded-lg font-medium hover:bg-brand-primary/90"
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// ==================== NOTES TAB ====================

const NotesTab: React.FC<{ subjects: Subject[] }> = ({ subjects }) => {
    const { language, t } = useLanguage();
    const [notes, setNotes] = useState<Note[]>([]);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    useEffect(() => {
        setNotes(studyService.getNotes());
    }, []);

    const filteredNotes = search
        ? studyService.searchNotes(search)
        : notes;

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('study_search_notes') as string}
                    className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-neutral-900 placeholder-neutral-500"
                />
            </div>

            {/* Add Button */}
            <button
                onClick={() => setShowAddModal(true)}
                className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-neutral-500 dark:text-neutral-400 hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
                <Plus size={18} />
                <span>{t('study_new_note')}</span>
            </button>

            {/* Notes Grid */}
            <div className="grid grid-cols-2 gap-3">
                {filteredNotes.map(note => {
                    const subject = subjects.find(s => s.id === note.subject);
                    return (
                        <button
                            key={note.id}
                            onClick={() => setSelectedNote(note)}
                            className="bg-white dark:bg-brand-surface/40  border-neutral-200 dark:border-white/5 text-start hover:shadow-md transition-shadow hover:bg-brand-surface/60"
                        >
                            <h4 className="font-medium text-sm truncate text-neutral-900">{note.title}</h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                                {note.content.slice(0, 100)}
                            </p>
                            {subject && (
                                <span
                                    className="inline-block px-2 py-0.5 rounded text-xs mt-2"
                                    style={{ backgroundColor: subject.color + '20', color: subject.color }}
                                >
                                    {subject.name}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {filteredNotes.length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                    <StickyNote size={40} className="mx-auto mb-2 opacity-50" />
                    <p>{t('study_no_notes')}</p>
                </div>
            )}

            {/* Add/View Note Modal */}
            {(showAddModal || selectedNote) && (
                <NoteModal
                    note={selectedNote}
                    subjects={subjects}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedNote(null);
                    }}
                    onSave={() => setNotes(studyService.getNotes())}
                />
            )}
        </div>
    );
};

// Note Modal
const NoteModal: React.FC<{
    note: Note | null;
    subjects: Subject[];
    onClose: () => void;
    onSave: () => void;
}> = ({ note, subjects, onClose, onSave }) => {
    const { language, t } = useLanguage();
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [subject, setSubject] = useState(note?.subject || '');
    const [tags, setTags] = useState(note?.tags.join(', ') || '');

    const handleSave = () => {
        if (!title.trim()) return;

        const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

        if (note) {
            studyService.updateNote(note.id, { title, content, subject, tags: tagArray });
        } else {
            studyService.addNote({ title, content, subject, tags: tagArray });
        }

        onSave();
        onClose();
    };

    const handleDelete = () => {
        if (note) {
            studyService.deleteNote(note.id);
            onSave();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-brand-surface w-full max-w-md max-h-[80vh] rounded-2xl shadow-glass border border-white/10 flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                        {note ? t('study_edit_note') : t('study_new_note')}
                    </h3>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {note && (
                            <button onClick={handleDelete} className="p-1 text-red-400 hover:text-red-300">
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-neutral-500 dark:text-neutral-400">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('study_note_title') as string}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-neutral-900 dark:text-white placeholder-neutral-500"
                    />

                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-neutral-900 dark:text-white"
                    >
                        <option value="" className="bg-brand-surface text-neutral-900 dark:text-white">{t('study_select_subject')}</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id} className="bg-brand-surface text-neutral-900 dark:text-white">{s.name}</option>
                        ))}
                    </select>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={t('study_note_content') as string}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-neutral-900 dark:text-white placeholder-neutral-500 h-32 resize-none"
                    />

                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder={t('study_tags') as string}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-neutral-900 dark:text-white placeholder-neutral-500"
                    />

                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="w-full py-3 bg-brand-primary text-neutral-900 dark:text-white rounded-lg font-medium disabled:opacity-50 hover:bg-brand-primary/90"
                    >
                        {t('study_save_note')}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ==================== FLASHCARDS TAB ====================

const FlashcardsTab: React.FC<{ subjects: Subject[] }> = ({ subjects }) => {
    const { language, t } = useLanguage();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [showAddDeck, setShowAddDeck] = useState(false);
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
    const [studyMode, setStudyMode] = useState(false);

    useEffect(() => {
        setDecks(studyService.getDecks());
    }, []);

    if (studyMode && selectedDeck) {
        return (
            <FlashcardStudy
                deck={selectedDeck}
                onBack={() => {
                    setStudyMode(false);
                    setDecks(studyService.getDecks());
                }}
            />
        );
    }

    if (selectedDeck) {
        return (
            <DeckManager
                deck={selectedDeck}
                onBack={() => {
                    setSelectedDeck(null);
                    setDecks(studyService.getDecks());
                }}
                onStudy={() => setStudyMode(true)}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Add Deck Button */}
            <button
                onClick={() => setShowAddDeck(true)}
                className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
                <Plus size={18} />
                <span>{t('study_new_deck')}</span>
            </button>

            {/* Decks Grid */}
            <div className="grid grid-cols-2 gap-3">
                {decks.map(deck => {
                    const subject = subjects.find(s => s.id === deck.subject);
                    const dueCards = studyService.getDueCards(deck.id).length;

                    return (
                        <button
                            key={deck.id}
                            onClick={() => setSelectedDeck(deck)}
                            className="bg-white rounded-xl p-4 shadow-sm border text-start hover:shadow-md transition-shadow"
                        >
                            <h4 className="font-bold">{deck.name}</h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                {deck.cardCount} {t('study_cards')}
                            </p>
                            {dueCards > 0 && (
                                <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs mt-2">
                                    {dueCards} {t('study_due')}
                                </span>
                            )}
                            {subject && (
                                <span
                                    className="inline-block px-2 py-0.5 rounded text-xs mt-2 ms-1"
                                    style={{ backgroundColor: subject.color + '20', color: subject.color }}
                                >
                                    {subject.name}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {decks.length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                    <Layers size={40} className="mx-auto mb-2 opacity-50" />
                    <p>{t('study_no_decks')}</p>
                </div>
            )}

            {/* Add Deck Modal */}
            {showAddDeck && (
                <AddDeckModal
                    subjects={subjects}
                    onClose={() => setShowAddDeck(false)}
                    onAdd={() => setDecks(studyService.getDecks())}
                />
            )}
        </div>
    );
};

// Add Deck Modal
const AddDeckModal: React.FC<{
    subjects: Subject[];
    onClose: () => void;
    onAdd: () => void;
}> = ({ subjects, onClose, onAdd }) => {
    const { language, t } = useLanguage();
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) return;
        studyService.addDeck(name.trim(), subject);
        onAdd();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-bold">{t('study_new_deck')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('study_deck_name') as string}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                    />

                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">{t('study_no_subject')}</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="w-full py-3 bg-blue-600 text-neutral-900 dark:text-white rounded-lg font-medium disabled:opacity-50"
                    >
                        {t('study_create')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Deck Manager
const DeckManager: React.FC<{
    deck: Deck;
    onBack: () => void;
    onStudy: () => void;
}> = ({ deck, onBack, onStudy }) => {
    const { language, t } = useLanguage();
    const [cards, setCards] = useState<Card[]>([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');

    useEffect(() => {
        setCards(studyService.getDeckCards(deck.id));
    }, [deck.id]);

    const handleAddCard = () => {
        if (!front.trim() || !back.trim()) return;
        studyService.addCard(deck.id, front.trim(), back.trim());
        setCards(studyService.getDeckCards(deck.id));
        setFront('');
        setBack('');
        setShowAddCard(false);
    };

    const dueCount = studyService.getDueCards(deck.id).length;

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center text-blue-600 text-sm space-x-1 rtl:space-x-reverse">
                <ArrowLeft size={16} />
                <span>{t('back')}</span>
            </button>

            <div className="bg-white rounded-xl p-4 shadow-sm">
                <h2 className="font-bold text-lg">{deck.name}</h2>
                <p className="text-sm text-neutral-500 mt-1">
                    {cards.length} {t('study_cards')} •
                    {dueCount} {t('study_due_review')}
                </p>

                {dueCount > 0 && (
                    <button
                        onClick={onStudy}
                        className="mt-3 w-full py-2 bg-blue-600 text-neutral-900 dark:text-white rounded-lg font-medium"
                    >
                        {t('study_start_review')} ({dueCount})
                    </button>
                )}
            </div>

            {/* Add Card */}
            {showAddCard ? (
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                    <textarea
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                        placeholder={t('study_front') as string}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                    />
                    <textarea
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        placeholder={t('study_back') as string}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={() => setShowAddCard(false)}
                            className="flex-1 py-2 bg-neutral-100 rounded-lg text-neutral-600"
                        >
                            {t('cancel' as any)}
                        </button>
                        <button
                            onClick={handleAddCard}
                            disabled={!front.trim() || !back.trim()}
                            className="flex-1 py-2 bg-blue-600 text-neutral-900 dark:text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {t('study_add_task').split(' ')[0]}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddCard(true)}
                    className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-500 hover:border-blue-500 hover:text-blue-500"
                >
                    <Plus size={18} className="inline me-1" />
                    {t('study_add_card')}
                </button>
            )}

            {/* Card List */}
            <div className="space-y-2">
                {cards.map(card => (
                    <div key={card.id} className="bg-white rounded-lg p-3 shadow-sm border">
                        <p className="font-medium text-sm">{card.front}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{card.back}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Flashcard Study Mode
const FlashcardStudy: React.FC<{
    deck: Deck;
    onBack: () => void;
}> = ({ deck, onBack }) => {
    const { language, t } = useLanguage();
    const [dueCards, setDueCards] = useState<Card[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showBack, setShowBack] = useState(false);

    useEffect(() => {
        setDueCards(studyService.getDueCards(deck.id));
    }, [deck.id]);

    const currentCard = dueCards[currentIndex];

    const handleRate = (rating: 'again' | 'good' | 'easy') => {
        studyService.reviewCard(currentCard.id, rating);
        setShowBack(false);

        if (currentIndex < dueCards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onBack();
        }
    };

    if (dueCards.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-lg font-medium text-green-600 mb-2">
                    {t('study_all_done')}
                </p>
                <button onClick={onBack} className="text-blue-600">
                    {t('back')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="text-blue-600 text-sm">
                    {t('study_exit')}
                </button>
                <span className="text-sm text-neutral-500">
                    {currentIndex + 1} / {dueCards.length}
                </span>
            </div>

            <div
                onClick={() => setShowBack(true)}
                className="bg-white rounded-2xl p-8 shadow-lg min-h-[200px] flex items-center justify-center cursor-pointer"
            >
                <p className="text-lg text-center">
                    {showBack ? currentCard.back : currentCard.front}
                </p>
            </div>

            {!showBack && (
                <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
                    {t('study_tap_reveal')}
                </p>
            )}

            {showBack && (
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <button
                        onClick={() => handleRate('again')}
                        className="flex-1 py-3 bg-red-100 text-red-600 rounded-lg font-medium"
                    >
                        {t('study_again')}
                    </button>
                    <button
                        onClick={() => handleRate('good')}
                        className="flex-1 py-3 bg-yellow-100 text-yellow-600 rounded-lg font-medium"
                    >
                        {t('study_good')}
                    </button>
                    <button
                        onClick={() => handleRate('easy')}
                        className="flex-1 py-3 bg-green-100 text-green-600 rounded-lg font-medium"
                    >
                        {t('study_easy')}
                    </button>
                </div>
            )}
        </div>
    );
};
