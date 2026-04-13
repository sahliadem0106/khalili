/**
 * TafsirService - Quran Tafsir (commentary) using Quran.com API
 * Provides access to various tafsir sources for Quranic verses
 */

// =================== TYPES ===================

export interface TafsirSource {
    id: number;
    name: string;
    authorName: string;
    slug: string;
    languageName: string;
    translatedName: {
        name: string;
        languageName: string;
    };
}

export interface TafsirContent {
    tafsirId: number;
    tafsirName: string;
    verseKey: string; // e.g., "2:255"
    text: string; // HTML content
    languageId: number;
    resourceId: number;
}

export interface Translation {
    id: number;
    resourceId: number;
    text: string;
    verseKey: string;
}

export interface TranslationSource {
    id: number;
    name: string;
    authorName: string;
    slug: string;
    languageName: string;
    translatedName: {
        name: string;
        languageName: string;
    };
}

// =================== CONSTANTS ===================

const API_BASE_URL = 'https://api.quran.com/api/v4';

const STORAGE_KEY_TAFSIR = 'khalil_tafsir_source';
const STORAGE_KEY_TRANSLATION = 'khalil_translation';

// Popular tafsir sources
export const POPULAR_TAFSIRS: TafsirSource[] = [
    { id: 169, name: 'Tafsir Ibn Kathir', authorName: 'Ibn Kathir', slug: 'en-tafisr-ibn-kathir', languageName: 'english', translatedName: { name: 'Tafsir Ibn Kathir', languageName: 'english' } },
    { id: 168, name: "Ma'arif al-Qur'an", authorName: 'Mufti Muhammad Shafi', slug: 'en-tafsir-maarif-ul-quran', languageName: 'english', translatedName: { name: "Ma'arif al-Qur'an", languageName: 'english' } },
    { id: 817, name: 'Tazkirul Quran', authorName: 'Maulana Wahid Uddin Khan', slug: 'tazkirul-quran-en', languageName: 'english', translatedName: { name: 'Tazkirul Quran', languageName: 'english' } },
    { id: 91, name: 'Tafhim al-Quran', authorName: 'Sayyid Abul Ala Maududi', slug: 'en-tafsir-maududi', languageName: 'english', translatedName: { name: 'Tafhim al-Quran', languageName: 'english' } },
];

// Popular translations
export const POPULAR_TRANSLATIONS: TranslationSource[] = [
    { id: 131, name: 'Dr. Mustafa Khattab, The Clear Quran', authorName: 'Dr. Mustafa Khattab', slug: 'clearquran-with-tafsir', languageName: 'english', translatedName: { name: 'The Clear Quran', languageName: 'english' } },
    { id: 85, name: 'Saheeh International', authorName: 'Saheeh International', slug: 'sahih-international', languageName: 'english', translatedName: { name: 'Saheeh International', languageName: 'english' } },
    { id: 20, name: "Abdullah Yusuf Ali", authorName: 'Abdullah Yusuf Ali', slug: 'en-yusufali', languageName: 'english', translatedName: { name: 'Abdullah Yusuf Ali', languageName: 'english' } },
    { id: 84, name: 'Muhammad Taqi-ud-Din al-Hilali & Muhammad Muhsin Khan', authorName: 'Hilali & Khan', slug: 'en-hilali-khan', languageName: 'english', translatedName: { name: 'Hilali & Khan', languageName: 'english' } },
    { id: 19, name: 'Pickthall', authorName: 'Mohammed Marmaduke William Pickthall', slug: 'en-pickthall', languageName: 'english', translatedName: { name: 'Pickthall', languageName: 'english' } },
];

// =================== SERVICE CLASS ===================

class TafsirService {
    private selectedTafsirId: number = 168; // Default: Ma'arif al-Qur'an (169 is broken)
    private selectedTranslationId: number = 131; // Default: Clear Quran
    private cache: Map<string, any> = new Map();

    constructor() {
        this.loadSettings();
    }

    /**
     * Get available tafsir sources from API
     */
    async getTafsirSources(): Promise<TafsirSource[]> {
        const cacheKey = 'tafsir_sources';
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/resources/tafsirs`);
            if (!response.ok) throw new Error('Failed to fetch tafsir sources');

            const data = await response.json();
            this.cache.set(cacheKey, data.tafsirs);
            return data.tafsirs;
        } catch (error) {
            console.error('Failed to fetch tafsir sources:', error);
            return POPULAR_TAFSIRS;
        }
    }

    /**
     * Get available translation sources from API
     */
    async getTranslationSources(): Promise<TranslationSource[]> {
        const cacheKey = 'translation_sources';
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/resources/translations`);
            if (!response.ok) throw new Error('Failed to fetch translation sources');

            const data = await response.json();
            this.cache.set(cacheKey, data.translations);
            return data.translations;
        } catch (error) {
            console.error('Failed to fetch translation sources:', error);
            return POPULAR_TRANSLATIONS;
        }
    }

    /**
     * Get tafsir for a specific verse
     */
    async getTafsir(
        surahNumber: number,
        ayahNumber: number,
        tafsirId: number = this.selectedTafsirId
    ): Promise<TafsirContent | null> {
        const verseKey = `${surahNumber}:${ayahNumber}`;
        const cacheKey = `tafsir_${tafsirId}_${verseKey}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/quran/tafsirs/${tafsirId}?verse_key=${verseKey}`
            );

            if (!response.ok) throw new Error('Failed to fetch tafsir');

            const data = await response.json();

            if (data.tafsir) {
                const content: TafsirContent = {
                    tafsirId,
                    tafsirName: data.tafsir.resource_name || 'Unknown',
                    verseKey,
                    text: data.tafsir.text || '',
                    languageId: data.tafsir.language_id,
                    resourceId: data.tafsir.resource_id,
                };

                this.cache.set(cacheKey, content);
                return content;
            }

            return null;
        } catch (error) {
            console.error(`Failed to fetch tafsir for ${verseKey}:`, error);
            throw error; // Propagate error to hook
        }
    }

    /**
     * Get tafsir for multiple verses (e.g., a page or range)
     */
    async getTafsirForRange(
        surahNumber: number,
        startAyah: number,
        endAyah: number,
        tafsirId: number = this.selectedTafsirId
    ): Promise<TafsirContent[]> {
        const results: TafsirContent[] = [];

        // Fetch in parallel with some rate limiting
        const batchSize = 5;
        for (let i = startAyah; i <= endAyah; i += batchSize) {
            const batch = [];
            for (let j = i; j < Math.min(i + batchSize, endAyah + 1); j++) {
                batch.push(this.getTafsir(surahNumber, j, tafsirId));
            }

            const batchResults = await Promise.all(batch);
            results.push(...batchResults.filter(r => r !== null) as TafsirContent[]);
        }

        return results;
    }

    /**
     * Get translation for a specific verse
     */
    async getTranslation(
        surahNumber: number,
        ayahNumber: number,
        translationId: number = this.selectedTranslationId
    ): Promise<Translation | null> {
        const verseKey = `${surahNumber}:${ayahNumber}`;
        const cacheKey = `translation_${translationId}_${verseKey}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/quran/translations/${translationId}?verse_key=${verseKey}`
            );

            if (!response.ok) throw new Error('Failed to fetch translation');

            const data = await response.json();

            if (data.translations && data.translations.length > 0) {
                const translation: Translation = {
                    id: data.translations[0].id,
                    resourceId: data.translations[0].resource_id,
                    text: data.translations[0].text,
                    verseKey,
                };

                this.cache.set(cacheKey, translation);
                return translation;
            }

            return null;
        } catch (error) {
            console.error(`Failed to fetch translation for ${verseKey}:`, error);
            return null;
        }
    }

    /**
     * Get verses with translation for a chapter
     */
    async getVersesWithTranslation(
        surahNumber: number,
        translationId: number = this.selectedTranslationId,
        page: number = 1,
        perPage: number = 50
    ): Promise<{ verses: any[], pagination: any }> {
        const cacheKey = `verses_${surahNumber}_${translationId}_${page}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/verses/by_chapter/${surahNumber}?translations=${translationId}&page=${page}&per_page=${perPage}&fields=text_uthmani,verse_key`
            );

            if (!response.ok) throw new Error('Failed to fetch verses');

            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch verses for surah ${surahNumber}:`, error);
            return { verses: [], pagination: {} };
        }
    }

    /**
     * Set selected tafsir
     */
    setTafsir(tafsirId: number): void {
        this.selectedTafsirId = tafsirId;
        this.saveSettings();
    }

    /**
     * Set selected translation
     */
    setTranslation(translationId: number): void {
        this.selectedTranslationId = translationId;
        this.saveSettings();
    }

    /**
     * Get current tafsir ID
     */
    getSelectedTafsirId(): number {
        return this.selectedTafsirId;
    }

    /**
     * Get current translation ID
     */
    getSelectedTranslationId(): number {
        return this.selectedTranslationId;
    }

    /**
     * Strip HTML tags from tafsir text
     */
    stripHtml(html: string): string {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }

    /**
     * Clear cache (for memory management)
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Load settings from localStorage
     */
    private loadSettings(): void {
        try {
            const savedTafsir = localStorage.getItem(STORAGE_KEY_TAFSIR);
            const savedTranslation = localStorage.getItem(STORAGE_KEY_TRANSLATION);

            if (savedTafsir) {
                const parsed = parseInt(savedTafsir, 10);
                // Migrate broken Ibn Kathir (169) to Ma'arif (168)
                this.selectedTafsirId = (parsed === 169) ? 168 : parsed;
            }
            if (savedTranslation) {
                this.selectedTranslationId = parseInt(savedTranslation, 10);
            }
        } catch (e) {
            console.error('Failed to load tafsir settings:', e);
        }
    }

    /**
     * Save settings to localStorage
     */
    private saveSettings(): void {
        try {
            localStorage.setItem(STORAGE_KEY_TAFSIR, String(this.selectedTafsirId));
            localStorage.setItem(STORAGE_KEY_TRANSLATION, String(this.selectedTranslationId));
        } catch (e) {
            console.error('Failed to save tafsir settings:', e);
        }
    }
}

// Export singleton instance
export const tafsirService = new TafsirService();
