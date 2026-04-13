import { useState, useEffect, useCallback } from 'react';
import { QadaStats } from '../types';

const STORAGE_KEY = 'khalil_qada';

const DEFAULT_STATS: QadaStats = {
    totalMissed: 0,
    madeUp: 0,
};

export const useQada = () => {
    // Load initial state from storage or use default
    const [stats, setStats] = useState<QadaStats>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : DEFAULT_STATS;
        } catch (e) {
            console.error('Failed to load Qada stats:', e);
            return DEFAULT_STATS;
        }
    });

    // Persist changes to storage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save Qada stats:', e);
        }
    }, [stats]);

    const recordMissed = useCallback(() => {
        setStats(prev => ({
            ...prev,
            totalMissed: (prev.totalMissed || 0) + 1,
        }));
    }, []);

    const recordMadeUp = useCallback(() => {
        setStats(prev => ({
            ...prev,
            madeUp: (prev.madeUp || 0) + 1,
        }));
    }, []);

    const undoMissed = useCallback(() => {
        setStats(prev => ({
            ...prev,
            totalMissed: Math.max(0, (prev.totalMissed || 0) - 1),
        }));
    }, []);

    const undoMadeUp = useCallback(() => {
        setStats(prev => ({
            ...prev,
            madeUp: Math.max(0, (prev.madeUp || 0) - 1),
        }));
    }, []);

    return {
        stats,
        recordMissed,
        recordMadeUp,
        undoMissed,
        undoMadeUp,
    };
};
