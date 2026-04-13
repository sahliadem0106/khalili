/**
 * useTafsir - React hook for Quran tafsir and translations
 */

import { useState, useCallback } from 'react';
import {
    tafsirService,
    TafsirContent,
    Translation,
    POPULAR_TAFSIRS,
    POPULAR_TRANSLATIONS,
    TafsirSource,
    TranslationSource,
} from '../services/TafsirService';

interface UseTafsirReturn {
    // Data
    tafsir: TafsirContent | null;
    translation: Translation | null;

    // Loading states
    isLoadingTafsir: boolean;
    isLoadingTranslation: boolean;
    error: string | null;

    // Sources
    tafsirSources: TafsirSource[];
    translationSources: TranslationSource[];
    selectedTafsirId: number;
    selectedTranslationId: number;

    // Actions
    loadTafsir: (surah: number, ayah: number) => Promise<void>;
    loadTranslation: (surah: number, ayah: number) => Promise<void>;
    setTafsirSource: (tafsirId: number) => void;
    setTranslationSource: (translationId: number) => void;
    clearTafsir: () => void;
}

export function useTafsir(): UseTafsirReturn {
    const [tafsir, setTafsir] = useState<TafsirContent | null>(null);
    const [translation, setTranslation] = useState<Translation | null>(null);
    const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
    const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTafsirId, setSelectedTafsirId] = useState(tafsirService.getSelectedTafsirId());
    const [selectedTranslationId, setSelectedTranslationId] = useState(tafsirService.getSelectedTranslationId());

    const loadTafsir = useCallback(async (surah: number, ayah: number) => {
        setIsLoadingTafsir(true);
        setError(null);

        try {
            const result = await tafsirService.getTafsir(surah, ayah);
            setTafsir(result);
        } catch (e: any) {
            setError(e.message || 'Failed to load tafsir');
        } finally {
            setIsLoadingTafsir(false);
        }
    }, []);

    const loadTranslation = useCallback(async (surah: number, ayah: number) => {
        setIsLoadingTranslation(true);
        setError(null);

        try {
            const result = await tafsirService.getTranslation(surah, ayah);
            setTranslation(result);
        } catch (e: any) {
            setError(e.message || 'Failed to load translation');
        } finally {
            setIsLoadingTranslation(false);
        }
    }, []);

    const setTafsirSource = useCallback((tafsirId: number) => {
        tafsirService.setTafsir(tafsirId);
        setSelectedTafsirId(tafsirId);
        // Clear current tafsir to force reload
        setTafsir(null);
    }, []);

    const setTranslationSource = useCallback((translationId: number) => {
        tafsirService.setTranslation(translationId);
        setSelectedTranslationId(translationId);
        // Clear current translation to force reload
        setTranslation(null);
    }, []);

    const clearTafsir = useCallback(() => {
        setTafsir(null);
        setTranslation(null);
        setError(null);
    }, []);

    return {
        tafsir,
        translation,
        isLoadingTafsir,
        isLoadingTranslation,
        error,
        tafsirSources: POPULAR_TAFSIRS,
        translationSources: POPULAR_TRANSLATIONS,
        selectedTafsirId,
        selectedTranslationId,
        loadTafsir,
        loadTranslation,
        setTafsirSource,
        setTranslationSource,
        clearTafsir,
    };
}
