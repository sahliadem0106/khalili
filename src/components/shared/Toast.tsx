/**
 * Toast — Shared toast notification component
 * Animated, auto-dismissing, supports success/error/info variants
 * 
 * Usage:
 *   const [toast, setToast] = useState<ToastData | null>(null);
 *   const showToast = (message: string, type: ToastType = 'info') => setToast({ message, type });
 * 
 *   <AnimatePresence>
 *     {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
 *   </AnimatePresence>
 */

import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
    message: string;
    type: ToastType;
}

interface ToastProps extends ToastData {
    onDismiss: () => void;
    durationMs?: number;
}

const COLORS: Record<ToastType, string> = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-brand-primary text-white',
};

export const Toast: React.FC<ToastProps> = ({ message, type, onDismiss, durationMs = 3500 }) => {
    const dismiss = useCallback(onDismiss, [onDismiss]);

    useEffect(() => {
        const timer = setTimeout(dismiss, durationMs);
        return () => clearTimeout(timer);
    }, [dismiss, durationMs]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-xl font-medium text-sm ${COLORS[type]}`}
        >
            {message}
        </motion.div>
    );
};

/**
 * Hook for easy toast usage in any component.
 * Returns [toast, showToast, clearToast] tuple.
 */
export function useToast() {
    const [toast, setToast] = React.useState<ToastData | null>(null);
    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    }, []);
    const clearToast = useCallback(() => setToast(null), []);
    return { toast, showToast, clearToast } as const;
}
