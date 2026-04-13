/**
 * DuaFavoritesService - Manage dua favorites and custom lists
 */

export interface DuaFavorite {
    id: string;
    arabic: string;
    english: string;
    transliteration?: string;
    category?: string;
    source?: string;
    addedAt: string;
}

export interface DuaList {
    id: string;
    name: string;
    duaIds: string[];
    createdAt: string;
}

const STORAGE_KEY = 'khalil_dua_favorites';
const LISTS_KEY = 'khalil_dua_lists';

class DuaFavoritesService {
    private favorites: DuaFavorite[] = [];
    private lists: DuaList[] = [];
    private subscribers: Set<() => void> = new Set();

    constructor() {
        this.load();
    }

    private load(): void {
        try {
            const savedFavorites = localStorage.getItem(STORAGE_KEY);
            if (savedFavorites) {
                this.favorites = JSON.parse(savedFavorites);
            }

            const savedLists = localStorage.getItem(LISTS_KEY);
            if (savedLists) {
                this.lists = JSON.parse(savedLists);
            }
        } catch (e) {
            console.error('Failed to load dua favorites:', e);
        }
    }

    private save(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.favorites));
            localStorage.setItem(LISTS_KEY, JSON.stringify(this.lists));
        } catch (e) {
            console.error('Failed to save dua favorites:', e);
        }
    }

    private notify(): void {
        this.subscribers.forEach(cb => cb());
    }

    // ===== FAVORITES =====

    addFavorite(dua: Omit<DuaFavorite, 'addedAt'>): void {
        // Check if already exists
        if (this.favorites.some(f => f.id === dua.id)) {
            return;
        }

        this.favorites.push({
            ...dua,
            addedAt: new Date().toISOString(),
        });

        this.save();
        this.notify();
    }

    removeFavorite(duaId: string): void {
        this.favorites = this.favorites.filter(f => f.id !== duaId);
        this.save();
        this.notify();
    }

    isFavorite(duaId: string): boolean {
        return this.favorites.some(f => f.id === duaId);
    }

    getFavorites(): DuaFavorite[] {
        return [...this.favorites];
    }

    toggleFavorite(dua: Omit<DuaFavorite, 'addedAt'>): boolean {
        if (this.isFavorite(dua.id)) {
            this.removeFavorite(dua.id);
            return false;
        } else {
            this.addFavorite(dua);
            return true;
        }
    }

    // ===== CUSTOM LISTS =====

    createList(name: string): DuaList {
        const list: DuaList = {
            id: `list_${Date.now()}`,
            name,
            duaIds: [],
            createdAt: new Date().toISOString(),
        };

        this.lists.push(list);
        this.save();
        this.notify();
        return list;
    }

    deleteList(listId: string): void {
        this.lists = this.lists.filter(l => l.id !== listId);
        this.save();
        this.notify();
    }

    renameList(listId: string, newName: string): void {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.name = newName;
            this.save();
            this.notify();
        }
    }

    addToList(listId: string, duaId: string): void {
        const list = this.lists.find(l => l.id === listId);
        if (list && !list.duaIds.includes(duaId)) {
            list.duaIds.push(duaId);
            this.save();
            this.notify();
        }
    }

    removeFromList(listId: string, duaId: string): void {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.duaIds = list.duaIds.filter(id => id !== duaId);
            this.save();
            this.notify();
        }
    }

    getLists(): DuaList[] {
        return [...this.lists];
    }

    getList(listId: string): DuaList | undefined {
        return this.lists.find(l => l.id === listId);
    }

    getDuasInList(listId: string): DuaFavorite[] {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return [];
        return this.favorites.filter(f => list.duaIds.includes(f.id));
    }

    // ===== SUBSCRIPTION =====

    subscribe(callback: () => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
}

export const duaFavoritesService = new DuaFavoritesService();
