/**
 * StudySpacePage - Main Study Space container with tabs
 */

import React, { useState, useEffect } from 'react';
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
    Maximize2,
    Minimize2,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
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

    // Load subjects
    useEffect(() => {
        setSubjects(studyService.getSubjects());
    }, []);

    const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
        { id: 'tasks', icon: <CheckSquare size={20} />, label: 'Tasks', labelAr: 'المهام' },
        { id: 'calendar', icon: <Calendar size={20} />, label: 'Calendar', labelAr: 'التقويم' },
        { id: 'timer', icon: <Clock size={20} />, label: 'Timer', labelAr: 'المؤقت' },
        { id: 'notes', icon: <StickyNote size={20} />, label: 'Notes', labelAr: 'الملاحظات' },
        { id: 'flashcards', icon: <Layers size={20} />, label: 'Cards', labelAr: 'البطاقات' },
    ];

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold">
                        {t('study_space')}
                    </h1>
                    <button
                        onClick={() => setShowSubjectModal(true)}
                        className="p-2 hover:bg-white/10 rounded-full"
                    >
                        <BookOpen size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 rtl:space-x-reverse bg-white/10 p-1 rounded-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-white/80 hover:bg-white/10'
                                }`}
                        >
                            {tab.icon}
                            <span className="mt-1">{language === 'ar' ? tab.labelAr : tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {activeTab === 'tasks' && <TasksTab subjects={subjects} />}
                {activeTab === 'calendar' && <CalendarTab subjects={subjects} />}
                {activeTab === 'timer' && <TimerTab subjects={subjects} />}
                {activeTab === 'notes' && <NotesTab subjects={subjects} />}
                {activeTab === 'flashcards' && <FlashcardsTab subjects={subjects} />}
            </div>

            {/* Subject Manager Modal */}
            {showSubjectModal && (
                <SubjectManagerModal
                    subjects={subjects}
                    onClose={() => setShowSubjectModal(false)}
                    onUpdate={(updated) => setSubjects(updated)}
                />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-bold">{t('study_subjects')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
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
                            placeholder={t('study_subject_name')}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
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
                                className={`w-7 h-7 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
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
                                className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg"
                            >
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: subject.color }} />
                                    <span className="text-sm font-medium">{subject.name}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(subject.id)}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {subjects.length === 0 && (
                            <p className="text-center text-neutral-400 text-sm py-4">
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
                <div className="flex space-x-1 rtl:space-x-reverse bg-neutral-100 p-1 rounded-lg">
                    {['today', 'week', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500'
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
                    className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
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
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!subjectFilter ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'
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
                            className={`bg-white rounded-xl p-3 shadow-sm border ${task.done ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                <button
                                    onClick={() => toggleTask(task.id)}
                                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.done
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-neutral-300 hover:border-blue-500'
                                        }`}
                                >
                                    {task.done && <span className="text-xs">✓</span>}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-sm ${task.done ? 'line-through text-neutral-400' : ''}`}>
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
                                        <span className="text-xs text-neutral-400">
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-1 text-neutral-300 hover:text-red-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredTasks.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">
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

    const handleSubmit = () => {
        if (!title.trim()) return;
        studyService.addTask({
            title: title.trim(),
            subject,
            dueDate: new Date(dueDate),
            priority,
            done: false,
        });
        onAdd();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-bold">{t('study_new_task')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('study_task_title')}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                    />

                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">{t('study_select_subject')}</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />

                    <div className="flex space-x-2 rtl:space-x-reverse">
                        {(['low', 'medium', 'high'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPriority(p)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${priority === p
                                    ? p === 'high' ? 'bg-red-500 text-white'
                                        : p === 'medium' ? 'bg-yellow-500 text-white'
                                            : 'bg-green-500 text-white'
                                    : 'bg-neutral-100 text-neutral-600'
                                    }`}
                            >
                                {p === 'high' && t('study_high')}
                                {p === 'medium' && t('study_medium')}
                                {p === 'low' && t('study_low')}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                        {t('study_add_task')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== CALENDAR TAB (Placeholder) ====================

const CalendarTab: React.FC<{ subjects: Subject[] }> = ({ subjects }) => {
    const { language, t } = useLanguage();
    return (
        <div className="text-center py-12 text-neutral-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">{t('study_calendar')}</p>
            <p className="text-sm mt-1">{t('study_coming_soon')}</p>
        </div>
    );
};

// ==================== TIMER TAB ====================

const TimerTab: React.FC<{ subjects: Subject[] }> = ({ subjects }) => {
    const { language, t } = useLanguage();
    const [mode, setMode] = useState<'pomodoro' | 'long' | 'custom'>('pomodoro');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
    const [isBreak, setIsBreak] = useState(false);
    const [todayTotal, setTodayTotal] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
                // @ts-ignore
                if (window.screen.orientation && window.screen.orientation.lock) {
                    await window.screen.orientation.lock('landscape');
                }
                setIsFullscreen(true);
            } catch (err) {
                console.error("Error enabling fullscreen:", err);
            }
        } else {
            try {
                await document.exitFullscreen();
                // @ts-ignore
                if (window.screen.orientation && window.screen.orientation.unlock) {
                    window.screen.orientation.unlock();
                }
                setIsFullscreen(false);
            } catch (err) {
                console.error("Error exiting fullscreen:", err);
            }
        }
    };

    // Listen for fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                // @ts-ignore
                if (window.screen.orientation && window.screen.orientation.unlock) {
                    window.screen.orientation.unlock();
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


    const settings = DEFAULT_TIMER_SETTINGS;

    useEffect(() => {
        setTodayTotal(studyService.getTodayFocusTime());
    }, []);

    useEffect(() => {
        const workTime = settings[mode].work * 60;
        setTimeLeft(workTime);
        setIsRunning(false);
        setIsBreak(false);
    }, [mode]);

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Timer finished
                    setIsRunning(false);
                    if (!isBreak) {
                        // Save session
                        const duration = settings[mode].work;
                        studyService.addFocusSession(selectedSubject || 'General', duration);
                        setTodayTotal(studyService.getTodayFocusTime());
                        // Start break
                        setIsBreak(true);
                        return settings[mode].break * 60;
                    } else {
                        // Break finished, reset to work
                        setIsBreak(false);
                        return settings[mode].work * 60;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, isBreak, mode, selectedSubject]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const reset = () => {
        setIsRunning(false);
        setIsBreak(false);
        setTimeLeft(settings[mode].work * 60);
    };

    return (
        <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex space-x-2 rtl:space-x-reverse">
                {[
                    { id: 'pomodoro', label: '25/5' },
                    { id: 'long', label: '50/10' },
                    { id: 'custom', label: '45/15' },
                ].map(m => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        disabled={isRunning}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 text-neutral-600 disabled:opacity-50'
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Subject Selection */}
            <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            >
                <option value="">{t('study_general')}</option>
                {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            {/* Timer Display */}
            <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
                <p className={`text-sm font-medium mb-2 ${isBreak ? 'text-green-600' : 'text-blue-600'}`}>
                    {isBreak
                        ? t('study_break')
                        : t('study_focus')}
                </p>
                <div className={`text-6xl font-mono font-bold ${isBreak ? 'text-green-600' : 'text-neutral-800'}`}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4 rtl:space-x-reverse">
                <button
                    onClick={reset}
                    className="p-4 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
                >
                    <RotateCcw size={24} className="text-neutral-600" />
                </button>
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="p-6 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                >
                    {isRunning ? (
                        <Pause size={32} className="text-white" />
                    ) : (
                        <Play size={32} className="text-white ms-1" />
                    )}
                </button>
            </div>

            {/* Custom Fullscreen Mode */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-neutral-900 text-white flex flex-col items-center justify-center">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-indigo-900/40" />

                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50"
                    >
                        <Minimize2 size={32} />
                    </button>

                    <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-2 rounded-full text-lg font-medium ${isBreak ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                {isBreak
                                    ? t('study_break_time')
                                    : t('study_focus_time')}
                            </span>
                            {selectedSubject && (
                                <span className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-lg">
                                    {subjects.find(s => s.id === selectedSubject)?.name || selectedSubject}
                                </span>
                            )}
                        </div>

                        <div className={`text-[12rem] font-mono font-bold leading-none tracking-tight ${isBreak ? 'text-green-400' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                        </div>

                        <div className="flex items-center gap-8">
                            <button
                                onClick={reset}
                                className="p-6 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
                            >
                                <RotateCcw size={40} className="text-white/80" />
                            </button>
                            <button
                                onClick={() => setIsRunning(!isRunning)}
                                className={`p-10 rounded-full transition-all transform hover:scale-105 shadow-2xl ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isRunning ? (
                                    <Pause size={64} className="text-white" />
                                ) : (
                                    <Play size={64} className="text-white ms-2" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Toggle Button (Normal Mode) */}
            <div className="flex justify-center">
                <button
                    onClick={toggleFullscreen}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-sm text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <Maximize2 size={18} />
                    <span>{t('study_fullscreen')}</span>
                </button>
            </div>

            {/* Today's Total */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
                <p className="text-sm text-neutral-500">{t('study_todays_total')}</p>
                <p className="text-2xl font-bold text-blue-600">
                    {Math.floor(todayTotal / 60)}h {todayTotal % 60}m
                </p>
            </div>
        </div>
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
                <Search size={18} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('study_search_notes')}
                    className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            {/* Add Button */}
            <button
                onClick={() => setShowAddModal(true)}
                className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
                <Plus size={18} />
                <span>{language === 'ar' ? 'ملاحظة جديدة' : 'New Note'}</span>
            </button>

            {/* Notes Grid */}
            <div className="grid grid-cols-2 gap-3">
                {filteredNotes.map(note => {
                    const subject = subjects.find(s => s.id === note.subject);
                    return (
                        <button
                            key={note.id}
                            onClick={() => setSelectedNote(note)}
                            className="bg-white rounded-xl p-3 shadow-sm border text-start hover:shadow-md transition-shadow"
                        >
                            <h4 className="font-medium text-sm truncate">{note.title}</h4>
                            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
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
                <div className="text-center py-8 text-neutral-400">
                    <StickyNote size={40} className="mx-auto mb-2 opacity-50" />
                    <p>{language === 'ar' ? 'لا توجد ملاحظات' : 'No notes yet'}</p>
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
    const { language } = useLanguage();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md max-h-[80vh] rounded-2xl shadow-xl flex flex-col">
                <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                    <h3 className="font-bold">
                        {note ? (language === 'ar' ? 'تعديل الملاحظة' : 'Edit Note') : (language === 'ar' ? 'ملاحظة جديدة' : 'New Note')}
                    </h3>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {note && (
                            <button onClick={handleDelete} className="p-1 text-red-400 hover:text-red-600">
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={language === 'ar' ? 'عنوان الملاحظة' : 'Note title'}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />

                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">{language === 'ar' ? 'بدون مادة' : 'No subject'}</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={language === 'ar' ? 'محتوى الملاحظة (يدعم Markdown)' : 'Note content (supports Markdown)'}
                        rows={8}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-mono text-sm"
                    />

                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder={language === 'ar' ? 'وسوم (مفصولة بفاصلة)' : 'Tags (comma separated)'}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    />
                </div>

                <div className="p-4 border-t flex-shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                        {language === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== FLASHCARDS TAB ====================

const FlashcardsTab: React.FC<{ subjects: Subject[] }> = ({ subjects }) => {
    const { language } = useLanguage();
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
                <span>{language === 'ar' ? 'مجموعة جديدة' : 'New Deck'}</span>
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
                            <p className="text-xs text-neutral-400 mt-1">
                                {deck.cardCount} {language === 'ar' ? 'بطاقة' : 'cards'}
                            </p>
                            {dueCards > 0 && (
                                <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs mt-2">
                                    {dueCards} {language === 'ar' ? 'مستحقة' : 'due'}
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
                <div className="text-center py-8 text-neutral-400">
                    <Layers size={40} className="mx-auto mb-2 opacity-50" />
                    <p>{language === 'ar' ? 'لا توجد مجموعات' : 'No decks yet'}</p>
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
    const { language } = useLanguage();
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) return;
        studyService.addDeck(name.trim(), subject);
        onAdd();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-bold">{language === 'ar' ? 'مجموعة جديدة' : 'New Deck'}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={language === 'ar' ? 'اسم المجموعة' : 'Deck name'}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                    />

                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">{language === 'ar' ? 'بدون مادة' : 'No subject'}</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                        {language === 'ar' ? 'إنشاء' : 'Create'}
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
    const { language } = useLanguage();
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
                <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
            </button>

            <div className="bg-white rounded-xl p-4 shadow-sm">
                <h2 className="font-bold text-lg">{deck.name}</h2>
                <p className="text-sm text-neutral-500 mt-1">
                    {cards.length} {language === 'ar' ? 'بطاقة' : 'cards'} •
                    {dueCount} {language === 'ar' ? 'مستحقة للمراجعة' : 'due for review'}
                </p>

                {dueCount > 0 && (
                    <button
                        onClick={onStudy}
                        className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg font-medium"
                    >
                        {language === 'ar' ? 'ابدأ المراجعة' : 'Start Review'} ({dueCount})
                    </button>
                )}
            </div>

            {/* Add Card */}
            {showAddCard ? (
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                    <textarea
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                        placeholder={language === 'ar' ? 'الوجه الأمامي' : 'Front'}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                    />
                    <textarea
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        placeholder={language === 'ar' ? 'الوجه الخلفي' : 'Back'}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={() => setShowAddCard(false)}
                            className="flex-1 py-2 bg-neutral-100 rounded-lg text-neutral-600"
                        >
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleAddCard}
                            disabled={!front.trim() || !back.trim()}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {language === 'ar' ? 'إضافة' : 'Add'}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddCard(true)}
                    className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-500 hover:border-blue-500 hover:text-blue-500"
                >
                    <Plus size={18} className="inline me-1" />
                    {language === 'ar' ? 'إضافة بطاقة' : 'Add Card'}
                </button>
            )}

            {/* Card List */}
            <div className="space-y-2">
                {cards.map(card => (
                    <div key={card.id} className="bg-white rounded-lg p-3 shadow-sm border">
                        <p className="font-medium text-sm">{card.front}</p>
                        <p className="text-xs text-neutral-400 mt-1">{card.back}</p>
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
    const { language } = useLanguage();
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
                    {language === 'ar' ? 'أحسنت! لا توجد بطاقات مستحقة' : 'All done! No cards due'}
                </p>
                <button onClick={onBack} className="text-blue-600">
                    {language === 'ar' ? 'رجوع' : 'Back'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="text-blue-600 text-sm">
                    {language === 'ar' ? 'إنهاء' : 'Exit'}
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
                <p className="text-center text-neutral-400 text-sm">
                    {language === 'ar' ? 'اضغط لإظهار الإجابة' : 'Tap to reveal'}
                </p>
            )}

            {showBack && (
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <button
                        onClick={() => handleRate('again')}
                        className="flex-1 py-3 bg-red-100 text-red-600 rounded-lg font-medium"
                    >
                        {language === 'ar' ? 'مرة أخرى' : 'Again'}
                    </button>
                    <button
                        onClick={() => handleRate('good')}
                        className="flex-1 py-3 bg-yellow-100 text-yellow-600 rounded-lg font-medium"
                    >
                        {language === 'ar' ? 'جيد' : 'Good'}
                    </button>
                    <button
                        onClick={() => handleRate('easy')}
                        className="flex-1 py-3 bg-green-100 text-green-600 rounded-lg font-medium"
                    >
                        {language === 'ar' ? 'سهل' : 'Easy'}
                    </button>
                </div>
            )}
        </div>
    );
};
