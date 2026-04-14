/**
 * QuranAudioService - Quran audio playback using Quran.com API
 * Provides verse-by-verse and chapter recitation audio
 */
import { MOCK_SURAHS } from '../constants';

// =================== TYPES ===================

export interface Reciter {
    id: number;
    name: string;
    englishName: string;
    arabicName: string;
    style: string | null;
    translatedName: {
        name: string;
        languageName: string;
    };
    urlPrefix?: string; // e.g. "Mishari_Rashid_Al_Afasy_128kbps"
}

export interface ChapterAudio {
    id: number;
    chapterId: number;
    fileSize: number;
    format: string;
    audioUrl: string;
}

export interface VerseAudio {
    id: number;
    verseKey: string; // e.g., "2:255"
    url: string;
    chapterId: number;
    segments?: number[][]; // Word-level timing [[startMs, endMs, wordIndex], ...]
    format: string;
}

export interface AudioPlayerState {
    isPlaying: boolean;
    isLoading: boolean;
    currentSurah: number | null;
    currentAyah: number | null;
    currentReciterId: number;
    duration: number;
    currentTime: number;
    playbackMode: 'verse' | 'surah' | 'continuous';
    repeatMode: 'none' | 'verse' | 'surah';
}

// =================== CONSTANTS ===================

const API_BASE_URL = 'https://api.quran.com/api/v4';
const AUDIO_CDN = 'https://verses.quran.com';

const STORAGE_KEY_RECITER = 'khalil_quran_reciter';
const STORAGE_KEY_SETTINGS = 'khalil_audio_settings';

// Popular reciters with their IDs and URL prefixes
export const POPULAR_RECITERS: Reciter[] = [
    { id: 7, name: 'mishari_al_afasy', englishName: 'Mishari Rashid al-Afasy', arabicName: 'مشاري راشد العفاسي', style: 'Murattal', translatedName: { name: 'Mishari Rashid al-Afasy', languageName: 'english' }, urlPrefix: 'Mishari_Rashid_Al_Afasy_128kbps' },
    { id: 1, name: 'abdul_basit_murattal', englishName: 'Abdul Basit Abdul Samad', arabicName: 'عبد الباسط عبد الصمد', style: 'Murattal', translatedName: { name: 'Abdul Basit Abdul Samad', languageName: 'english' }, urlPrefix: 'Abdul_Basit_Murattal_64kbps' },
    { id: 5, name: 'maher_al_muaiqly', englishName: 'Maher Al Muaiqly', arabicName: 'ماهر المعيقلي', style: 'Murattal', translatedName: { name: 'Maher Al Muaiqly', languageName: 'english' }, urlPrefix: 'MaherAlMuaiqly128kbps' },
    { id: 3, name: 'sudais', englishName: 'Abdur-Rahman as-Sudais', arabicName: 'عبدالرحمن السديس', style: 'Murattal', translatedName: { name: 'Abdur-Rahman as-Sudais', languageName: 'english' }, urlPrefix: 'Abdurrahmaan_As-Sudais_192kbps' },
    { id: 4, name: 'saad_al_ghamdi', englishName: 'Saad Al-Ghamdi', arabicName: 'سعد الغامدي', style: 'Murattal', translatedName: { name: 'Saad Al-Ghamdi', languageName: 'english' }, urlPrefix: 'Saad_Al-Ghamdi_128kbps' },
    { id: 6, name: 'mahmoud_al_hussary', englishName: 'Mahmoud Khalil Al-Hussary', arabicName: 'محمود خليل الحصري', style: 'Murattal', translatedName: { name: 'Mahmoud Khalil Al-Hussary', languageName: 'english' }, urlPrefix: 'Husary_128kbps' },
    { id: 9, name: 'hani_ar_rifai', englishName: 'Hani ar-Rifai', arabicName: 'هاني الرفاعي', style: 'Murattal', translatedName: { name: 'Hani ar-Rifai', languageName: 'english' }, urlPrefix: 'Hani_Rifai_192kbps' },
    { id: 10, name: 'ibrahim_al_akhdar', englishName: 'Ibrahim Al-Akhdar', arabicName: 'إبراهيم الأخضر', style: 'Murattal', translatedName: { name: 'Ibrahim Al-Akhdar', languageName: 'english' }, urlPrefix: 'Ibrahim_Akhdar_32kbps' },
];

export interface AudioSettings {
    reciterId: number;
    autoPlay: boolean;
    repeatVerse: boolean;
    repeatCount: number;
    playbackSpeed: number;
    showTranslation: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
    reciterId: 7, // Mishari al-Afasy
    autoPlay: false,
    repeatVerse: false,
    repeatCount: 1,
    playbackSpeed: 1.0,
    showTranslation: true,
};

// =================== SERVICE CLASS ===================

class QuranAudioService {
    private audioElement: HTMLAudioElement | null = null;
    private settings: AudioSettings = DEFAULT_AUDIO_SETTINGS;
    private listeners: Set<(state: AudioPlayerState) => void> = new Set();
    private state: AudioPlayerState = {
        isPlaying: false,
        isLoading: false,
        currentSurah: null,
        currentAyah: null,
        currentReciterId: 7,
        duration: 0,
        currentTime: 0,
        playbackMode: 'verse',
        repeatMode: 'none',
    };
    private reciters: Reciter[] = POPULAR_RECITERS;
    private verseAudioUrlCache: Map<string, string> = new Map();

    private resolveSurahAyahCount(surahNumber: number, fallback?: number): number {
        if (fallback && fallback > 0) return fallback;
        return MOCK_SURAHS.find((s) => s.number === surahNumber)?.numberOfAyahs || 0;
    }

    constructor() {
        this.loadSettings();
        this.initAudioElement();
    }

    /**
     * Initialize the HTML Audio element
     */
    private initAudioElement(): void {
        if (typeof window === 'undefined') return;

        this.audioElement = new Audio();
        this.audioElement.preload = 'metadata';

        // Event listeners
        this.audioElement.addEventListener('loadstart', () => {
            this.updateState({ isLoading: true });
        });

        this.audioElement.addEventListener('canplay', () => {
            this.updateState({ isLoading: false });
        });

        this.audioElement.addEventListener('play', () => {
            this.updateState({ isPlaying: true });
        });

        this.audioElement.addEventListener('pause', () => {
            this.updateState({ isPlaying: false });
        });

        this.audioElement.addEventListener('ended', () => {
            this.handleAudioEnded();
        });

        this.audioElement.addEventListener('timeupdate', () => {
            if (this.audioElement) {
                this.updateState({ currentTime: this.audioElement.currentTime });
            }
        });

        this.audioElement.addEventListener('durationchange', () => {
            if (this.audioElement) {
                this.updateState({ duration: this.audioElement.duration });
            }
        });

        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.updateState({ isLoading: false, isPlaying: false });
        });
    }

    /**
     * Get all available reciters from API
     */
    async getReciters(): Promise<Reciter[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/resources/recitations`);
            if (!response.ok) throw new Error('Failed to fetch reciters');

            const data = await response.json();
            // Map API response to our Reciter interface
            // API returns: { id, reciter_name, style, translated_name, url_prefix }
            if (data.recitations) {
                this.reciters = data.recitations.map((r: any) => ({
                    id: r.id,
                    name: r.reciter_name,
                    englishName: r.translated_name?.name || r.reciter_name,
                    arabicName: r.reciter_name, // API might not give arabic name directly in this endpoint sometimes
                    style: r.style,
                    translatedName: r.translated_name,
                    urlPrefix: r.url_prefix
                }));
                return this.reciters;
            }
            return POPULAR_RECITERS;
        } catch (error) {
            console.error('Failed to fetch reciters:', error);
            return POPULAR_RECITERS; // Fallback to cached list
        }
    }

    /**
     * Get audio URL for a specific verse
     */
    getVerseAudioUrl(surahNumber: number, ayahNumber: number, reciterId: number = this.settings.reciterId): string {
        // Find reciter to get urlPrefix
        const reciter = this.reciters.find(r => r.id === reciterId) || POPULAR_RECITERS.find(r => r.id === reciterId);

        // Padded format: 001001.mp3 for 1:1
        const surahPadded = String(surahNumber).padStart(3, '0');
        const ayahPadded = String(ayahNumber).padStart(3, '0');

        if (reciter?.urlPrefix) {
            return `${AUDIO_CDN}/${reciter.urlPrefix}/${surahPadded}${ayahPadded}.mp3`;
        }

        // Fallback for when we don't have urlPrefix (legacy/fallback behavior)
        // BEWARE: This often fails if reciter ID doesn't match a path directly, which is why we added urlPrefix support
        return `${AUDIO_CDN}/${surahPadded}${ayahPadded}.mp3`; // Some default common path? Or maybe fail
    }

    private normalizeAudioUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        if (url.startsWith('/')) {
            return `https://verses.quran.com${url}`;
        }
        return `https://verses.quran.com/${url}`;
    }

    private async resolvePlayableVerseAudioUrl(
        surahNumber: number,
        ayahNumber: number,
        reciterId: number = this.settings.reciterId
    ): Promise<string> {
        const verseKey = `${surahNumber}:${ayahNumber}`;
        const cacheKey = `${reciterId}_${verseKey}`;
        const cached = this.verseAudioUrlCache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(`${API_BASE_URL}/recitations/${reciterId}/by_ayah/${verseKey}`);
            if (response.ok) {
                const data = await response.json();
                const apiUrl = data?.audio_files?.[0]?.url;
                if (apiUrl) {
                    const normalized = this.normalizeAudioUrl(apiUrl);
                    this.verseAudioUrlCache.set(cacheKey, normalized);
                    return normalized;
                }
            }
        } catch (error) {
            console.warn(`Falling back to static audio URL for ${verseKey}:`, error);
        }

        const fallback = this.getVerseAudioUrl(surahNumber, ayahNumber, reciterId);
        this.verseAudioUrlCache.set(cacheKey, fallback);
        return fallback;
    }

    /**
     * Play a specific verse
     */
    async playVerse(surahNumber: number, ayahNumber: number): Promise<void> {
        if (!this.audioElement) return;
        const url = await this.resolvePlayableVerseAudioUrl(surahNumber, ayahNumber);

        this.updateState({
            currentSurah: surahNumber,
            currentAyah: ayahNumber,
            isLoading: true,
        });

        this.audioElement.src = url;
        this.audioElement.playbackRate = this.settings.playbackSpeed;

        try {
            await this.audioElement.play();
        } catch (error) {
            console.error('Failed to play verse:', error);
            this.updateState({ isLoading: false });
        }
    }

    /**
     * Play next verse
     */
    async playNextVerse(totalAyahsInSurah?: number): Promise<void> {
        if (this.state.currentSurah === null || this.state.currentAyah === null) return;

        const resolvedAyahCount = this.resolveSurahAyahCount(this.state.currentSurah, totalAyahsInSurah);
        if (resolvedAyahCount <= 0) {
            this.pause();
            return;
        }

        const nextAyah = this.state.currentAyah + 1;

        if (nextAyah <= resolvedAyahCount) {
            await this.playVerse(this.state.currentSurah, nextAyah);
        } else {
            // End of surah
            this.pause();
        }
    }

    /**
     * Play previous verse
     */
    async playPreviousVerse(): Promise<void> {
        if (this.state.currentSurah === null || this.state.currentAyah === null) return;

        const prevAyah = this.state.currentAyah - 1;

        if (prevAyah >= 1) {
            await this.playVerse(this.state.currentSurah, prevAyah);
        }
    }

    /**
     * Handle audio ended event
     */
    private handleAudioEnded(): void {
        if (this.state.repeatMode === 'verse') {
            // Repeat same verse
            if (this.state.currentSurah && this.state.currentAyah) {
                this.playVerse(this.state.currentSurah, this.state.currentAyah);
            }
        } else if (this.state.repeatMode === 'surah') {
            // Continue within surah, then restart at ayah 1 after last ayah.
            if (this.state.currentSurah && this.state.currentAyah) {
                const ayahCount = this.resolveSurahAyahCount(this.state.currentSurah);
                if (ayahCount > 0 && this.state.currentAyah >= ayahCount) {
                    this.playVerse(this.state.currentSurah, 1);
                } else {
                    this.playNextVerse(ayahCount);
                }
            }
        } else {
            // Default behavior depends on user settings.
            if (!this.settings.autoPlay) {
                this.updateState({ isPlaying: false });
                return;
            }

            // Auto-advance to the next verse within the same surah.
            if (this.state.currentSurah) {
                const ayahCount = this.resolveSurahAyahCount(this.state.currentSurah);
                if (ayahCount > 0) {
                    this.playNextVerse(ayahCount);
                } else {
                    this.updateState({ isPlaying: false });
                }
            } else {
                this.updateState({ isPlaying: false });
            }
        }
    }

    /**
     * Pause playback
     */
    pause(): void {
        this.audioElement?.pause();
    }

    /**
     * Resume playback
     */
    async resume(): Promise<void> {
        try {
            await this.audioElement?.play();
        } catch (error) {
            console.error('Failed to resume:', error);
        }
    }

    /**
     * Toggle play/pause
     */
    async toggle(): Promise<void> {
        if (this.state.isPlaying) {
            this.pause();
        } else {
            await this.resume();
        }
    }

    /**
     * Seek to position
     */
    seek(time: number): void {
        if (this.audioElement) {
            this.audioElement.currentTime = time;
        }
    }

    /**
     * Set playback speed
     */
    setPlaybackSpeed(speed: number): void {
        this.settings.playbackSpeed = speed;
        if (this.audioElement) {
            this.audioElement.playbackRate = speed;
        }
        this.saveSettings();
    }

    /**
     * Set reciter
     */
    setReciter(reciterId: number): void {
        this.settings.reciterId = reciterId;
        this.updateState({ currentReciterId: reciterId });
        this.saveSettings();

        // If currently playing, restart with new reciter
        if (this.state.isPlaying && this.state.currentSurah && this.state.currentAyah) {
            this.playVerse(this.state.currentSurah, this.state.currentAyah);
        }
    }

    /**
     * Set repeat mode
     */
    setRepeatMode(mode: 'none' | 'verse' | 'surah'): void {
        this.updateState({ repeatMode: mode });
    }

    /**
     * Stop playback and reset
     */
    stop(): void {
        this.pause();
        if (this.audioElement) {
            this.audioElement.currentTime = 0;
            this.audioElement.src = '';
        }
        this.updateState({
            currentSurah: null,
            currentAyah: null,
            currentTime: 0,
            duration: 0,
            isPlaying: false,
        });
    }

    /**
     * Get current state
     */
    getState(): AudioPlayerState {
        return { ...this.state };
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: AudioPlayerState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Update state and notify listeners
     */
    private updateState(updates: Partial<AudioPlayerState>): void {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach(listener => listener(this.state));
    }

    /**
     * Load settings from localStorage
     */
    private loadSettings(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (saved) {
                this.settings = { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(saved) };
            }
            this.state.currentReciterId = this.settings.reciterId;
        } catch (e) {
            console.error('Failed to load audio settings:', e);
        }
    }

    /**
     * Save settings to localStorage
     */
    private saveSettings(): void {
        try {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save audio settings:', e);
        }
    }

    /**
     * Get current settings
     */
    getSettings(): AudioSettings {
        return { ...this.settings };
    }

    /**
     * Update settings
     */
    updateSettings(updates: Partial<AudioSettings>): void {
        this.settings = { ...this.settings, ...updates };
        this.saveSettings();
    }
}

// Export singleton instance
export const quranAudioService = new QuranAudioService();
