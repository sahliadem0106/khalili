/**
 * useQuranAudio - React hook for Quran audio playback
 */

import { useState, useEffect, useCallback } from 'react';
import {
    quranAudioService,
    AudioPlayerState,
    AudioSettings,
    POPULAR_RECITERS,
    Reciter
} from '../services/QuranAudioService';

interface UseQuranAudioReturn {
    // Player state
    isPlaying: boolean;
    isLoading: boolean;
    currentSurah: number | null;
    currentAyah: number | null;
    duration: number;
    currentTime: number;
    progress: number; // 0-100
    repeatMode: 'none' | 'verse' | 'surah';

    // Settings
    settings: AudioSettings;
    reciters: Reciter[];
    currentReciter: Reciter | undefined;

    // Actions
    playVerse: (surah: number, ayah: number) => Promise<void>;
    playNextVerse: (totalAyahs: number) => Promise<void>;
    playPreviousVerse: () => Promise<void>;
    pause: () => void;
    resume: () => Promise<void>;
    toggle: () => Promise<void>;
    stop: () => void;
    seek: (time: number) => void;
    seekPercent: (percent: number) => void;
    setReciter: (reciterId: number) => void;
    setPlaybackSpeed: (speed: number) => void;
    setRepeatMode: (mode: 'none' | 'verse' | 'surah') => void;
}

export function useQuranAudio(): UseQuranAudioReturn {
    const [state, setState] = useState<AudioPlayerState>(quranAudioService.getState());
    const [settings, setSettings] = useState<AudioSettings>(quranAudioService.getSettings());

    // Subscribe to state changes
    useEffect(() => {
        const unsubscribe = quranAudioService.subscribe(setState);
        return unsubscribe;
    }, []);

    // Actions
    const playVerse = useCallback(async (surah: number, ayah: number) => {
        await quranAudioService.playVerse(surah, ayah);
    }, []);

    const playNextVerse = useCallback(async (totalAyahs: number) => {
        await quranAudioService.playNextVerse(totalAyahs);
    }, []);

    const playPreviousVerse = useCallback(async () => {
        await quranAudioService.playPreviousVerse();
    }, []);

    const pause = useCallback(() => {
        quranAudioService.pause();
    }, []);

    const resume = useCallback(async () => {
        await quranAudioService.resume();
    }, []);

    const toggle = useCallback(async () => {
        await quranAudioService.toggle();
    }, []);

    const stop = useCallback(() => {
        quranAudioService.stop();
    }, []);

    const seek = useCallback((time: number) => {
        quranAudioService.seek(time);
    }, []);

    const seekPercent = useCallback((percent: number) => {
        if (state.duration > 0) {
            quranAudioService.seek((percent / 100) * state.duration);
        }
    }, [state.duration]);

    const setReciter = useCallback((reciterId: number) => {
        quranAudioService.setReciter(reciterId);
        setSettings(quranAudioService.getSettings());
    }, []);

    const setPlaybackSpeed = useCallback((speed: number) => {
        quranAudioService.setPlaybackSpeed(speed);
        setSettings(quranAudioService.getSettings());
    }, []);

    const setRepeatMode = useCallback((mode: 'none' | 'verse' | 'surah') => {
        quranAudioService.setRepeatMode(mode);
    }, []);

    // Computed values
    const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
    const currentReciter = POPULAR_RECITERS.find(r => r.id === state.currentReciterId);

    return {
        isPlaying: state.isPlaying,
        isLoading: state.isLoading,
        currentSurah: state.currentSurah,
        currentAyah: state.currentAyah,
        duration: state.duration,
        currentTime: state.currentTime,
        progress,
        repeatMode: state.repeatMode,
        settings,
        reciters: POPULAR_RECITERS,
        currentReciter,
        playVerse,
        playNextVerse,
        playPreviousVerse,
        pause,
        resume,
        toggle,
        stop,
        seek,
        seekPercent,
        setReciter,
        setPlaybackSpeed,
        setRepeatMode,
    };
}
