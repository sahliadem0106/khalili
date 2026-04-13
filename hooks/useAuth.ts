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

    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;

    updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<string>;

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

    // ... (existing methods)

    // Update profile
    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        setError(null);
        try {
            await authService.updateProfile(updates);
        } catch (e: any) {
            setError('Failed to update profile');
            throw e;
        }
    }, []);

    // Upload avatar
    const uploadAvatar = useCallback(async (file: File) => {
        setError(null);
        try {
            return await authService.uploadAvatar(file);
        } catch (e: any) {
            setError('Failed to upload avatar');
            throw e;
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





    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isLoading: authState.status === 'loading',
        isAuthenticated: authState.status === 'authenticated',
        user: authState.status === 'authenticated' ? authState.user : null,

        signInWithGoogle,
        signOut,

        updateSettings,
        updateProfile,
        uploadAvatar,
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
