/**
 * HabitService - Habit Tracker data management with localStorage
 */

// =================== TYPES ===================

export interface Habit {
    id: string;
    name: string;
    type: 'build' | 'break';
    frequency: 'daily' | 'custom';
    days?: number[]; // [0,1,2,3,4,5,6] for custom, 0 = Sunday
    reminderTime?: string; // HH:MM format
    islamicRef?: string;
    icon?: string;
    color?: string;
    createdAt: Date;
    active: boolean;
}

export interface HabitLog {
    habitId: string;
    date: string; // YYYY-MM-DD
    completed: boolean;
}

export interface HabitStats {
    id: string;
    name: string;
    currentStreak: number;
    longestStreak: number;
    completionRate: number; // percentage
    totalCompletions: number;
}

export interface DayStatus {
    date: string;
    total: number;
    completed: number;
    percentage: number;
}

// =================== CONSTANTS ===================

const STORAGE_KEYS = {
    HABITS: 'khalil_habits',
    HABIT_LOGS: 'khalil_habit_logs',
};

export const HABIT_TEMPLATES: Omit<Habit, 'id' | 'createdAt' | 'active'>[] = [
    { name: 'Pray Tahajjud', type: 'build', frequency: 'daily', icon: '🌙', islamicRef: 'وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ' },
    { name: 'Read Quran (5 pages)', type: 'build', frequency: 'daily', icon: '📖', islamicRef: 'خيركم من تعلم القرآن وعلمه' },
    { name: 'Morning Adhkar', type: 'build', frequency: 'daily', reminderTime: '06:00', icon: '☀️' },
    { name: 'Evening Adhkar', type: 'build', frequency: 'daily', reminderTime: '17:00', icon: '🌅' },
    { name: 'Exercise', type: 'build', frequency: 'daily', icon: '🏃', islamicRef: 'المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف' },
    { name: 'Sleep before 11pm', type: 'build', frequency: 'daily', icon: '😴', reminderTime: '22:30' },
    { name: 'Wake for Fajr', type: 'build', frequency: 'daily', icon: '🌄' },
    { name: 'No phone 1hr before bed', type: 'break', frequency: 'daily', icon: '📵' },
    { name: 'Drink 8 glasses water', type: 'build', frequency: 'daily', icon: '💧' },
    { name: 'Call parents weekly', type: 'build', frequency: 'custom', days: [5], icon: '📞', islamicRef: 'بر الوالدين' },
    { name: 'Fast Mondays', type: 'build', frequency: 'custom', days: [1], icon: '🍽️' },
    { name: 'Fast Thursdays', type: 'build', frequency: 'custom', days: [4], icon: '🍽️' },
];

export const HABIT_COLORS = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63',
    '#00BCD4', '#795548', '#607D8B', '#F44336', '#3F51B5',
];

export const HABIT_ICONS = [
    '📖', '🕌', '🌙', '☀️', '🏃', '💧', '😴', '📵', '🍽️', '📞',
    '✨', '🎯', '💪', '🧘', '📝', '🎓', '💡', '❤️', '🙏', '⭐',
];

// =================== HELPER ===================

const generateId = (): string => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const parseDate = (val: any): Date => {
    if (val instanceof Date) return val;
    return new Date(val);
};

const getDateStr = (date: Date = new Date()): string => {
    return date.toISOString().split('T')[0];
};

// =================== SERVICE CLASS ===================

class HabitService {
    // ========== HABITS ==========

    getHabits(): Habit[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HABITS);
            if (data) {
                return JSON.parse(data).map((h: any) => ({
                    ...h,
                    createdAt: parseDate(h.createdAt),
                }));
            }
        } catch (e) {
            console.error('Failed to load habits:', e);
        }
        return [];
    }

    saveHabits(habits: Habit[]): void {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    }

    addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'active'>): Habit {
        const habits = this.getHabits();
        const newHabit: Habit = {
            ...habit,
            id: generateId(),
            createdAt: new Date(),
            active: true,
        };
        habits.push(newHabit);
        this.saveHabits(habits);
        return newHabit;
    }

    addHabitFromTemplate(template: typeof HABIT_TEMPLATES[0]): Habit {
        return this.addHabit(template);
    }

    updateHabit(id: string, updates: Partial<Habit>): void {
        const habits = this.getHabits();
        const index = habits.findIndex(h => h.id === id);
        if (index !== -1) {
            habits[index] = { ...habits[index], ...updates };
            this.saveHabits(habits);
        }
    }

    deleteHabit(id: string): void {
        const habits = this.getHabits().filter(h => h.id !== id);
        this.saveHabits(habits);
        // Also delete all logs for this habit
        const logs = this.getHabitLogs().filter(l => l.habitId !== id);
        this.saveHabitLogs(logs);
    }

    toggleHabitActive(id: string): void {
        const habits = this.getHabits();
        const index = habits.findIndex(h => h.id === id);
        if (index !== -1) {
            habits[index].active = !habits[index].active;
            this.saveHabits(habits);
        }
    }

    // ========== HABIT LOGS ==========

    getHabitLogs(): HabitLog[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load habit logs:', e);
        }
        return [];
    }

    saveHabitLogs(logs: HabitLog[]): void {
        localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs));
    }

    logHabit(habitId: string, date: string = getDateStr(), completed: boolean = true): void {
        const logs = this.getHabitLogs();
        const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === date);

        if (existingIndex !== -1) {
            logs[existingIndex].completed = completed;
        } else {
            logs.push({ habitId, date, completed });
        }

        this.saveHabitLogs(logs);
    }

    toggleHabitLog(habitId: string, date: string = getDateStr()): boolean {
        const logs = this.getHabitLogs();
        const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === date);

        let newState: boolean;
        if (existingIndex !== -1) {
            newState = !logs[existingIndex].completed;
            logs[existingIndex].completed = newState;
        } else {
            newState = true;
            logs.push({ habitId, date, completed: true });
        }

        this.saveHabitLogs(logs);
        return newState;
    }

    isHabitCompletedToday(habitId: string): boolean {
        const today = getDateStr();
        const log = this.getHabitLogs().find(l => l.habitId === habitId && l.date === today);
        return log?.completed ?? false;
    }

    // ========== TODAY'S HABITS ==========

    getTodaysHabits(): Habit[] {
        const today = new Date();
        const dayOfWeek = today.getDay();

        return this.getHabits().filter(h => {
            if (!h.active) return false;
            if (h.frequency === 'daily') return true;
            if (h.frequency === 'custom' && h.days) {
                return h.days.includes(dayOfWeek);
            }
            return false;
        });
    }

    getTodayProgress(): { total: number; completed: number; percentage: number } {
        const todaysHabits = this.getTodaysHabits();
        const today = getDateStr();
        const logs = this.getHabitLogs().filter(l => l.date === today && l.completed);

        const completedCount = todaysHabits.filter(h =>
            logs.some(l => l.habitId === h.id)
        ).length;

        return {
            total: todaysHabits.length,
            completed: completedCount,
            percentage: todaysHabits.length > 0 ? Math.round((completedCount / todaysHabits.length) * 100) : 0,
        };
    }

    // ========== STREAKS ==========

    getStreak(habitId: string): number {
        const logs = this.getHabitLogs()
            .filter(l => l.habitId === habitId && l.completed)
            .sort((a, b) => b.date.localeCompare(a.date));

        if (logs.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        const checkDate = new Date(today);

        // Check if completed today
        const todayStr = getDateStr(today);
        if (logs.some(l => l.date === todayStr)) {
            streak = 1;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Count consecutive days
        while (true) {
            const dateStr = getDateStr(checkDate);
            if (logs.some(l => l.date === dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    getLongestStreak(habitId: string): number {
        const logs = this.getHabitLogs()
            .filter(l => l.habitId === habitId && l.completed)
            .sort((a, b) => a.date.localeCompare(b.date));

        if (logs.length === 0) return 0;

        let longest = 1;
        let current = 1;

        for (let i = 1; i < logs.length; i++) {
            const prevDate = new Date(logs[i - 1].date);
            const currDate = new Date(logs[i].date);
            const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 1;
            }
        }

        return longest;
    }

    // ========== STATS ==========

    getHabitStats(habitId: string): HabitStats {
        const habit = this.getHabits().find(h => h.id === habitId);
        const logs = this.getHabitLogs().filter(l => l.habitId === habitId);

        // Calculate completion rate for last 30 days
        const last30Days: string[] = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            last30Days.push(getDateStr(d));
        }

        const completedLast30 = logs.filter(l =>
            last30Days.includes(l.date) && l.completed
        ).length;

        return {
            id: habitId,
            name: habit?.name || '',
            currentStreak: this.getStreak(habitId),
            longestStreak: this.getLongestStreak(habitId),
            completionRate: Math.round((completedLast30 / 30) * 100),
            totalCompletions: logs.filter(l => l.completed).length,
        };
    }

    getAllStats(): HabitStats[] {
        return this.getHabits().map(h => this.getHabitStats(h.id));
    }

    // ========== CALENDAR DATA ==========

    getMonthData(year: number, month: number): DayStatus[] {
        const habits = this.getHabits().filter(h => h.active);
        const logs = this.getHabitLogs();
        const result: DayStatus[] = [];

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = getDateStr(date);
            const dayOfWeek = date.getDay();

            // Get habits that should be done on this day
            const relevantHabits = habits.filter(h => {
                if (h.frequency === 'daily') return true;
                if (h.frequency === 'custom' && h.days) {
                    return h.days.includes(dayOfWeek);
                }
                return false;
            });

            const completed = relevantHabits.filter(h =>
                logs.some(l => l.habitId === h.id && l.date === dateStr && l.completed)
            ).length;

            result.push({
                date: dateStr,
                total: relevantHabits.length,
                completed,
                percentage: relevantHabits.length > 0 ? Math.round((completed / relevantHabits.length) * 100) : 0,
            });
        }

        return result;
    }

    getDayHabits(date: string): { habit: Habit; completed: boolean }[] {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        const logs = this.getHabitLogs();

        return this.getHabits()
            .filter(h => {
                if (!h.active) return false;
                if (h.frequency === 'daily') return true;
                if (h.frequency === 'custom' && h.days) {
                    return h.days.includes(dayOfWeek);
                }
                return false;
            })
            .map(habit => ({
                habit,
                completed: logs.some(l => l.habitId === habit.id && l.date === date && l.completed),
            }));
    }
}

// Export singleton
export const habitService = new HabitService();
