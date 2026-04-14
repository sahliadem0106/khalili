/**
 * TasbihLogService - Tracks dhikr/tasbih sessions with persistence
 * Stores completed sessions and computes stats from real data
 */

// =================== TYPES ===================

export interface TasbihSession {
    id: string;
    dhikr: string;          // What was recited
    dhikrArabic: string;    // Arabic text
    count: number;          // How many times
    target: number | null;  // Goal (null = infinite)
    mode: 'single' | 'combo';
    completedAt: string;    // ISO timestamp
}

export interface TasbihStats {
    totalCount: number;
    todayCount: number;
    sessionsCompleted: number;
    todaySessions: number;
}

// =================== CONSTANTS ===================

const STORAGE_KEY = 'khalil_tasbih_sessions';

// =================== HELPER ===================

function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

function getDateStr(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
}

// =================== SERVICE CLASS ===================

class TasbihLogService {
    private sessions: TasbihSession[] = [];
    private listeners: Set<() => void> = new Set();

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Load sessions from localStorage
     */
    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.sessions = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading tasbih sessions:', e);
            this.sessions = [];
        }
    }

    /**
     * Save sessions to localStorage
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
            this.notifyListeners();
        } catch (e) {
            console.error('Error saving tasbih sessions:', e);
        }
    }

    /**
     * Log a completed tasbih session
     */
    logSession(
        dhikr: string,
        dhikrArabic: string,
        count: number,
        target: number | null = null,
        mode: 'single' | 'combo' = 'single'
    ): TasbihSession {
        const session: TasbihSession = {
            id: generateId(),
            dhikr,
            dhikrArabic,
            count,
            target,
            mode,
            completedAt: new Date().toISOString(),
        };

        this.sessions.push(session);
        this.saveToStorage();

        // Gamification trigger
        import('./BadgeService').then(({ BadgeService }) => {
            BadgeService.updateStat('tasbih_count', count);
        }).catch(err => console.error('Failed to update badges', err));

        return session;
    }

    /**
     * Get all sessions
     */
    getSessions(): TasbihSession[] {
        return [...this.sessions];
    }

    /**
     * Get today's sessions
     */
    getTodaySessions(): TasbihSession[] {
        const today = getDateStr();
        return this.sessions.filter(s => s.completedAt.startsWith(today));
    }

    /**
     * Get sessions for a date range
     */
    getSessionsForDays(days: number): TasbihSession[] {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return this.sessions.filter(s => new Date(s.completedAt) >= cutoff);
    }

    /**
     * Compute stats from real data
     */
    getStats(): TasbihStats {
        const todaySessions = this.getTodaySessions();

        return {
            totalCount: this.sessions.reduce((sum, s) => sum + s.count, 0),
            todayCount: todaySessions.reduce((sum, s) => sum + s.count, 0),
            sessionsCompleted: this.sessions.length,
            todaySessions: todaySessions.length,
        };
    }

    /**
     * Subscribe to changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Clear all sessions (for testing)
     */
    clearSessions(): void {
        this.sessions = [];
        this.saveToStorage();
    }
}

// Export singleton
export const tasbihLogService = new TasbihLogService();
