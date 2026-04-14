/**
 * StudyService - Study Space data management with localStorage
 */

// =================== TYPES ===================

export interface Subject {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
}

export interface Task {
    id: string;
    title: string;
    subject: string;
    dueDate: Date;
    priority: 'high' | 'medium' | 'low';
    done: boolean;
    notes?: string;
    createdAt: Date;
}

export interface StudyBlock {
    id: string;
    type: 'class' | 'study';
    subject: string;
    title: string;
    startTime: Date;
    endTime: Date;
    dayOfWeek: number; // 0-6
}

export interface FocusSession {
    id: string;
    subject: string;
    duration: number; // minutes
    date: string; // YYYY-MM-DD
    createdAt: Date;
}

export interface Note {
    id: string;
    title: string;
    content: string; // markdown
    subject?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Card {
    id: string;
    deckId: string;
    front: string;
    back: string;
    nextReview: Date;
    interval: number; // days
}

export interface Deck {
    id: string;
    name: string;
    subject: string;
    cardCount: number;
    createdAt: Date;
}

export type TimerMode = 'pomodoro' | 'long' | 'custom' | 'between_prayers';

export interface TimerSettings {
    pomodoro: { work: number; break: number };
    long: { work: number; break: number };
    custom: { work: number; break: number };
}

export interface StreakSettings {
    dailyGoalMinutes: number; // Minimum minutes to count as a streak day
}

// =================== CONSTANTS ===================

const STORAGE_KEYS = {
    SUBJECTS: 'khalil_study_subjects',
    TASKS: 'khalil_study_tasks',
    BLOCKS: 'khalil_study_blocks',
    SESSIONS: 'khalil_focus_sessions',
    NOTES: 'khalil_study_notes',
    DECKS: 'khalil_flashcard_decks',
    CARDS: 'khalil_flashcard_cards',
    TIMER_SETTINGS: 'khalil_timer_settings',
    STREAK_SETTINGS: 'khalil_streak_settings',
};

export const DEFAULT_COLORS = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63',
    '#00BCD4', '#795548', '#607D8B', '#F44336', '#3F51B5',
];

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
    pomodoro: { work: 25, break: 5 },
    long: { work: 50, break: 10 },
    custom: { work: 45, break: 15 },
};

export const DEFAULT_STREAK_SETTINGS: StreakSettings = {
    dailyGoalMinutes: 30, // Default: 30 minutes to count as a streak day
};

// =================== HELPER ===================

const generateId = (): string => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const parseDate = (val: any): Date => {
    if (val instanceof Date) return val;
    return new Date(val);
};

// =================== SERVICE CLASS ===================

class StudyService {
    // ========== SUBJECTS ==========

    getSubjects(): Subject[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
            if (data) {
                return JSON.parse(data).map((s: any) => ({
                    ...s,
                    createdAt: parseDate(s.createdAt),
                }));
            }
        } catch (e) {
            console.error('Failed to load subjects:', e);
        }
        return [];
    }

    saveSubjects(subjects: Subject[]): void {
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    }

    addSubject(name: string, color: string): Subject {
        const subjects = this.getSubjects();
        const subject: Subject = {
            id: generateId(),
            name,
            color,
            createdAt: new Date(),
        };
        subjects.push(subject);
        this.saveSubjects(subjects);
        return subject;
    }

    updateSubject(id: string, updates: Partial<Subject>): void {
        const subjects = this.getSubjects();
        const index = subjects.findIndex(s => s.id === id);
        if (index !== -1) {
            subjects[index] = { ...subjects[index], ...updates };
            this.saveSubjects(subjects);
        }
    }

    deleteSubject(id: string): void {
        const subjects = this.getSubjects().filter(s => s.id !== id);
        this.saveSubjects(subjects);
    }

    // ========== TASKS ==========

    getTasks(): Task[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.TASKS);
            if (data) {
                return JSON.parse(data).map((t: any) => ({
                    ...t,
                    dueDate: parseDate(t.dueDate),
                    createdAt: parseDate(t.createdAt),
                }));
            }
        } catch (e) {
            console.error('Failed to load tasks:', e);
        }
        return [];
    }

    saveTasks(tasks: Task[]): void {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }

    addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
        const tasks = this.getTasks();
        const newTask: Task = {
            ...task,
            id: generateId(),
            createdAt: new Date(),
        };
        tasks.push(newTask);
        this.saveTasks(tasks);
        return newTask;
    }

    updateTask(id: string, updates: Partial<Task>): void {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            this.saveTasks(tasks);
        }
    }

    deleteTask(id: string): void {
        const tasks = this.getTasks().filter(t => t.id !== id);
        this.saveTasks(tasks);
    }

    toggleTask(id: string): void {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index].done = !tasks[index].done;
            this.saveTasks(tasks);
        }
    }

    // ========== STUDY BLOCKS ==========

    getStudyBlocks(): StudyBlock[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.BLOCKS);
            if (data) {
                return JSON.parse(data).map((b: any) => ({
                    ...b,
                    startTime: parseDate(b.startTime),
                    endTime: parseDate(b.endTime),
                }));
            }
        } catch (e) {
            console.error('Failed to load study blocks:', e);
        }
        return [];
    }

    saveStudyBlocks(blocks: StudyBlock[]): void {
        localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocks));
    }

    addStudyBlock(block: Omit<StudyBlock, 'id'>): StudyBlock {
        const blocks = this.getStudyBlocks();
        const newBlock: StudyBlock = {
            ...block,
            id: generateId(),
        };
        blocks.push(newBlock);
        this.saveStudyBlocks(blocks);
        return newBlock;
    }

    deleteStudyBlock(id: string): void {
        const blocks = this.getStudyBlocks().filter(b => b.id !== id);
        this.saveStudyBlocks(blocks);
    }

    // ========== FOCUS SESSIONS ==========

    getFocusSessions(): FocusSession[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
            if (data) {
                return JSON.parse(data).map((s: any) => ({
                    ...s,
                    createdAt: parseDate(s.createdAt),
                }));
            }
        } catch (e) {
            console.error('Failed to load focus sessions:', e);
        }
        return [];
    }

    saveFocusSessions(sessions: FocusSession[]): void {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }

    addFocusSession(subject: string, duration: number): FocusSession {
        const sessions = this.getFocusSessions();
        const session: FocusSession = {
            id: generateId(),
            subject,
            duration,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date(),
        };
        sessions.push(session);
        this.saveFocusSessions(sessions);

        // Update gamification stats
        import('./BadgeService').then(({ BadgeService }) => {
            BadgeService.updateStat('study_minutes', duration);
        }).catch(err => console.error('Failed to update badges', err));

        return session;
    }

    getTodayFocusTime(): number {
        const today = new Date().toISOString().split('T')[0];
        const sessions = this.getFocusSessions();
        return sessions
            .filter(s => s.date === today)
            .reduce((acc, s) => acc + s.duration, 0);
    }

    // ========== NOTES ==========

    getNotes(): Note[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.NOTES);
            if (data) {
                return JSON.parse(data).map((n: any) => ({
                    ...n,
                    createdAt: parseDate(n.createdAt),
                    updatedAt: parseDate(n.updatedAt),
                }));
            }
        } catch (e) {
            console.error('Failed to load notes:', e);
        }
        return [];
    }

    saveNotes(notes: Note[]): void {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }

    addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
        const notes = this.getNotes();
        const newNote: Note = {
            ...note,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        notes.push(newNote);
        this.saveNotes(notes);
        return newNote;
    }

    updateNote(id: string, updates: Partial<Note>): void {
        const notes = this.getNotes();
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
            notes[index] = { ...notes[index], ...updates, updatedAt: new Date() };
            this.saveNotes(notes);
        }
    }

    deleteNote(id: string): void {
        const notes = this.getNotes().filter(n => n.id !== id);
        this.saveNotes(notes);
    }

    searchNotes(query: string): Note[] {
        const notes = this.getNotes();
        const lowerQuery = query.toLowerCase();
        return notes.filter(n =>
            n.title.toLowerCase().includes(lowerQuery) ||
            n.content.toLowerCase().includes(lowerQuery) ||
            n.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    // ========== FLASHCARDS ==========

    getDecks(): Deck[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.DECKS);
            if (data) {
                return JSON.parse(data).map((d: any) => ({
                    ...d,
                    createdAt: parseDate(d.createdAt),
                }));
            }
        } catch (e) {
            console.error('Failed to load decks:', e);
        }
        return [];
    }

    saveDecks(decks: Deck[]): void {
        localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
    }

    addDeck(name: string, subject: string): Deck {
        const decks = this.getDecks();
        const newDeck: Deck = {
            id: generateId(),
            name,
            subject,
            cardCount: 0,
            createdAt: new Date(),
        };
        decks.push(newDeck);
        this.saveDecks(decks);
        return newDeck;
    }

    deleteDeck(id: string): void {
        const decks = this.getDecks().filter(d => d.id !== id);
        this.saveDecks(decks);
        // Also delete all cards in this deck
        const cards = this.getCards().filter(c => c.deckId !== id);
        this.saveCards(cards);
    }

    getCards(): Card[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CARDS);
            if (data) {
                return JSON.parse(data).map((c: any) => ({
                    ...c,
                    nextReview: parseDate(c.nextReview),
                }));
            }
        } catch (e) {
            console.error('Failed to load cards:', e);
        }
        return [];
    }

    saveCards(cards: Card[]): void {
        localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
        // Update deck card counts
        const decks = this.getDecks();
        decks.forEach(deck => {
            deck.cardCount = cards.filter(c => c.deckId === deck.id).length;
        });
        this.saveDecks(decks);
    }

    addCard(deckId: string, front: string, back: string): Card {
        const cards = this.getCards();
        const newCard: Card = {
            id: generateId(),
            deckId,
            front,
            back,
            nextReview: new Date(),
            interval: 0,
        };
        cards.push(newCard);
        this.saveCards(cards);
        return newCard;
    }

    getDeckCards(deckId: string): Card[] {
        return this.getCards().filter(c => c.deckId === deckId);
    }

    getDueCards(deckId: string): Card[] {
        const now = new Date();
        return this.getDeckCards(deckId).filter(c => c.nextReview <= now);
    }

    reviewCard(cardId: string, rating: 'again' | 'good' | 'easy'): void {
        const cards = this.getCards();
        const index = cards.findIndex(c => c.id === cardId);
        if (index !== -1) {
            const intervals = { again: 1, good: 3, easy: 7 };
            const daysToAdd = intervals[rating];
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + daysToAdd);

            cards[index].nextReview = nextReview;
            cards[index].interval = daysToAdd;
            this.saveCards(cards);
        }
    }

    deleteCard(id: string): void {
        const cards = this.getCards().filter(c => c.id !== id);
        this.saveCards(cards);
    }

    // ========== TIMER SETTINGS ==========

    getTimerSettings(): TimerSettings {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load timer settings:', e);
        }
        return DEFAULT_TIMER_SETTINGS;
    }

    saveTimerSettings(settings: TimerSettings): void {
        localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(settings));
    }

    // ========== STREAK SETTINGS ==========

    getStreakSettings(): StreakSettings {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.STREAK_SETTINGS);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load streak settings:', e);
        }
        return DEFAULT_STREAK_SETTINGS;
    }

    saveStreakSettings(settings: StreakSettings): void {
        localStorage.setItem(STORAGE_KEYS.STREAK_SETTINGS, JSON.stringify(settings));
    }

    getDayFocusTime(dateStr: string): number {
        const sessions = this.getFocusSessions();
        return sessions
            .filter(s => s.date === dateStr)
            .reduce((acc, s) => acc + s.duration, 0);
    }
}

// Export singleton
export const studyService = new StudyService();
