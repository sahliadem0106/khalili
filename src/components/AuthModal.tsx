/**
 * AuthModal - Login/Signup modal component
 */

import React, { useState } from 'react';
import {
    X,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t, language } = useLanguage();
    const {
        signInWithGoogle,
        error,
        clearError
    } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        clearError();
        setIsLoading(true);
        try {
            await signInWithGoogle();
            onSuccess?.();
            onClose();
        } catch (e) {
            // Error handled by hook
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            mass: 0.5
                        }}
                        className="bg-brand-surface w-full max-w-md rounded-3xl shadow-2xl border border-white/10 relative z-10 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-emerald-950 to-brand-primary/90 px-6 py-10 text-center relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                            >
                                <X size={18} />
                            </button>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                            >
                                <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20 shadow-xl shadow-brand-forest/20">
                                    <span className="text-4xl filter drop-shadow-md">🕌</span>
                                </div>

                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                    {t('auth_welcome')}
                                </h2>
                                <p className="text-brand-mint/90 text-sm font-medium">
                                    {t('auth_subtitle')}
                                </p>
                            </motion.div>
                        </div>

                        {/* Body */}
                        <div className="px-8 py-8 bg-brand-surface">
                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-6 overflow-hidden"
                                    >
                                        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start space-x-3 rtl:space-x-reverse">
                                            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-red-400 font-medium">{error}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-6">
                                <p className="text-center text-neutral-500 text-sm leading-relaxed px-4">
                                    {t('auth_sync_desc')}
                                </p>

                                {/* Google Sign In - ENHANCED */}
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                >
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading}
                                        className="w-full relative py-4 bg-white text-neutral-800 font-bold rounded-xl hover:bg-neutral-50 transition-all active:scale-[0.98] flex items-center justify-center space-x-3 rtl:space-x-reverse disabled:opacity-70 shadow-lg shadow-neutral-200/10 group border border-neutral-200"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={24} className="animate-spin text-brand-primary" />
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                <span className="text-lg">{t('auth_google')}</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-xs text-neutral-400">
                                    {t('auth_terms')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

