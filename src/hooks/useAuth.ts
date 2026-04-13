/**
 * useAuth - React hook for authentication
 */

import { useState, useEffect, useCallback } from 'react';
import {
    authService,
    AuthState,
    UserProfile,
    UserSettings
} from '../services/AuthService';

interface UseAuthReturn {
    // State
    isLoading: boolean;
    isAuthenticated: boolean;
    user: UserProfile | null;

    // Actions
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>;

    // Error handling
    error: string | null;
    clearError: () => void;
}

export function useAuth(): UseAuthReturn {
    const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
    const [error, setError] = useState<string | null>(null);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = authService.subscribe(setAuthState);
        return unsubscribe;
    }, []);

    // Sign in with email
    const signInWithEmail = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            await authService.signInWithEmail(email, password);
        } catch (e: any) {
            const message = getErrorMessage(e.code);
            setError(message);
            throw new Error(message);
        }
    }, []);

    // Sign up with email
    const signUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
        setError(null);
        try {
            await authService.signUpWithEmail(email, password, displayName);
        } catch (e: any) {
            const message = getErrorMessage(e.code);
            setError(message);
            throw new Error(message);
        }
    }, []);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        setError(null);
        try {
            await authService.signInWithGoogle();
        } catch (e: any) {
            const message = getErrorMessage(e.code);
            setError(message);
            throw new Error(message);
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        setError(null);
        try {
            await authService.signOut();
        } catch (e: any) {
            setError('Failed to sign out');
            throw e;
        }
    }, []);

    // Reset password
    const resetPassword = useCallback(async (email: string) => {
        setError(null);
        try {
            await authService.resetPassword(email);
        } catch (e: any) {
            const message = getErrorMessage(e.code);
            setError(message);
            throw new Error(message);
        }
    }, []);

    // Update settings
    const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
        setError(null);
        try {
            await authService.updateSettings(settings);
        } catch (e: any) {
            setError('Failed to update settings');
            throw e;
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isLoading: authState.status === 'loading',
        isAuthenticated: authState.status === 'authenticated',
        user: authState.status === 'authenticated' ? authState.user : null,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateSettings,
        error,
        clearError,
    };
}

// Helper to convert Firebase error codes to user-friendly messages
function getErrorMessage(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/popup-closed-by-user':
            return 'Sign in was cancelled.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An error occurred. Please try again.';
    }
}
