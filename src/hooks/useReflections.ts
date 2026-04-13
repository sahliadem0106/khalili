/**
 * useReflections - React hook for managing Quran reflections
 */

import { useState, useEffect, useCallback } from 'react';
import { reflectionsService, QuranReflection } from '../services/ReflectionsService';

interface UseReflectionsReturn {
    // Data
    reflections: QuranReflection[];
    currentReflection: QuranReflection | null;

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    createReflection: (data: {
        surahNumber: number;
        ayahNumber: number;
        verseKey: string;
        reflection: string;
        tags?: string[];
    }) => Promise<void>;
    updateReflection: (id: string, updates: Partial<Pick<QuranReflection, 'reflection' | 'tags'>>) => Promise<void>;
    deleteReflection: (id: string) => Promise<void>;
    loadReflectionsForVerse: (surah: number, ayah: number) => void;
    syncToCloud: () => Promise<void>;
    clearCurrent: () => void;
}

export function useReflections(): UseReflectionsReturn {
    const [reflections, setReflections] = useState<QuranReflection[]>([]);
    const [currentReflection, setCurrentReflection] = useState<QuranReflection | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to service changes
    useEffect(() => {
        const updateReflections = () => {
            setReflections(reflectionsService.getAllReflections());
        };

        updateReflections(); // Initial load
        const unsubscribe = reflectionsService.subscribe(updateReflections);
        return unsubscribe;
    }, []);

    const createReflection = useCallback(async (data: {
        surahNumber: number;
        ayahNumber: number;
        verseKey: string;
        reflection: string;
        tags?: string[];
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            await reflectionsService.createReflection({
                surahNumber: data.surahNumber,
                ayahNumber: data.ayahNumber,
                verseKey: data.verseKey,
                reflection: data.reflection,
                tags: data.tags || [],
            });
        } catch (e: any) {
            setError(e.message || 'Failed to create reflection');
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateReflection = useCallback(async (id: string, updates: Partial<Pick<QuranReflection, 'reflection' | 'tags'>>) => {
        setIsLoading(true);
        setError(null);

        try {
            await reflectionsService.updateReflection(id, updates);
        } catch (e: any) {
            setError(e.message || 'Failed to update reflection');
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteReflection = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await reflectionsService.deleteReflection(id);
            if (currentReflection?.id === id) {
                setCurrentReflection(null);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to delete reflection');
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, [currentReflection]);

    const loadReflectionsForVerse = useCallback((surah: number, ayah: number) => {
        const verseReflections = reflectionsService.getReflectionsByVerse(surah, ayah);
        setReflections(verseReflections);
        // Set the most recent reflection as current
        setCurrentReflection(verseReflections[0] || null);
    }, []);

    const syncToCloud = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await reflectionsService.syncToCloud();
        } catch (e: any) {
            setError(e.message || 'Failed to sync reflections');
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearCurrent = useCallback(() => {
        setCurrentReflection(null);
    }, []);

    return {
        reflections,
        currentReflection,
        isLoading,
        error,
        createReflection,
        updateReflection,
        deleteReflection,
        loadReflectionsForVerse,
        syncToCloud,
        clearCurrent,
    };
}
