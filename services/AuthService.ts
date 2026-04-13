/**
 * AuthService - Firebase Authentication service
 * Handles user authentication, profile management, and session state
 */

import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser,
    UserCredential,
    signInWithCredential,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { auth, db, storage } from './firebase';

// =================== TYPES ===================

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    gender?: 'male' | 'female';
    createdAt: Date;
    updatedAt: Date;
    premium: boolean;
    premiumExpiresAt: Date | null;
    settings: UserSettings;
    stats: UserStats;
}

export interface UserSettings {
    // Prayer settings
    calculationMethod: string;
    asrMethod: 'shafi' | 'hanafi';
    adjustments: {
        fajr: number;
        dhuhr: number;
        asr: number;
        maghrib: number;
        isha: number;
    };

    // Notification settings
    notificationsEnabled: boolean;
    prayerReminders: {
        fajr: boolean;
        dhuhr: boolean;
        asr: boolean;
        maghrib: boolean;
        isha: boolean;
    };
    reminderTiming: 'atTime' | 'before5' | 'before10' | 'before15' | 'before30';

    // App settings
    language: 'en' | 'ar';
    theme: 'light' | 'dark' | 'auto';

    // Quran settings
    preferredReciterId: number;
    preferredTranslationId: number;
    preferredTafsirId: number;
}

export interface UserStats {
    totalPrayersLogged: number;
    currentStreak: number;
    longestStreak: number;
    onTimeRate: number;
    lastPrayerDate: Date | null;
}

export type AuthState =
    | { status: 'loading' }
    | { status: 'authenticated'; user: UserProfile }
    | { status: 'unauthenticated' };

// =================== CONSTANTS ===================

const USERS_COLLECTION = 'users';

export const DEFAULT_USER_SETTINGS: UserSettings = {
    calculationMethod: 'MuslimWorldLeague',
    asrMethod: 'shafi',
    adjustments: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    notificationsEnabled: true,
    prayerReminders: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    reminderTiming: 'atTime',
    language: 'en',
    theme: 'light',
    preferredReciterId: 7,
    preferredTranslationId: 131,
    preferredTafsirId: 169,
};

const DEFAULT_USER_STATS: UserStats = {
    totalPrayersLogged: 0,
    currentStreak: 0,
    longestStreak: 0,
    onTimeRate: 0,
    lastPrayerDate: null,
};

// =================== SERVICE CLASS ===================

class AuthService {
    private currentUser: UserProfile | null = null;
    private authStateListeners: Set<(state: AuthState) => void> = new Set();
    private unsubscribeAuth: (() => void) | null = null;

    constructor() {
        this.initAuthListener();
    }

    /**
     * Initialize Firebase auth state listener & Refirect Result
     */
    private initAuthListener(): void {
        if (typeof window === 'undefined') return;

        // Check for redirect result (from Google Sign In)
        getRedirectResult(auth).then(async (credential) => {
            if (credential) {
                await this.handleAuthSuccess(credential);
            }
        }).catch((error) => {
            console.error("Redirect Auth Error:", error);
        });

        this.unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            // Import prayerLogService dynamically to avoid circular dependency
            const { prayerLogService } = await import('./PrayerLogService');

            if (firebaseUser) {
                try {
                    console.log('[AuthService] User logged in:', firebaseUser.uid);

                    // Switch prayer logs to this user
                    prayerLogService.setCurrentUser(firebaseUser.uid);

                    // Store user for other services
                    localStorage.setItem('auth_user', JSON.stringify({ uid: firebaseUser.uid }));

                    const profile = await this.getUserProfile(firebaseUser.uid);
                    if (profile) {
                        // Existing user - auto-complete onboarding ONLY if profile is truly complete (has gender)
                        const { onboardingService } = await import('./OnboardingService');
                        if (!onboardingService.isOnboardingComplete() && profile.gender) {
                            console.log('[AuthService] Existing user session restored (with gender) - auto-completing onboarding');
                            onboardingService.markGoogleLinked();
                            onboardingService.completeOnboarding();
                        }

                        this.currentUser = profile;
                        this.notifyListeners({ status: 'authenticated', user: profile });
                    } else {
                        // Profile missing (e.g. deleted from DB)
                        // CRITICAL FIX: Only sign out if this is a "Session Restore" (old login), 
                        // NOT if it's a fresh sign-in (which needs time to create the profile).

                        const lastSignInTime = firebaseUser.metadata.lastSignInTime
                            ? new Date(firebaseUser.metadata.lastSignInTime).getTime()
                            : 0;
                        const now = Date.now();
                        const isRecentLogin = (now - lastSignInTime) < 60000; // 1 minute grace period

                        if (!isRecentLogin) {
                            console.warn('[AuthService] Profile missing for OLD session. Signing out to enforce consistency.');
                            await this.signOut();
                            this.notifyListeners({ status: 'unauthenticated' });
                        } else {
                            console.log('[AuthService] Profile missing for NEW/RECENT session. Waiting for creation...');
                            // Do not sign out. handleAuthSuccess will create the profile and notify listeners.
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    this.notifyListeners({ status: 'unauthenticated' });
                }
            } else {
                console.log('[AuthService] User logged out - clearing prayer logs');

                // Clear prayer logs for this user
                prayerLogService.setCurrentUser(null);
                localStorage.removeItem('auth_user');

                this.currentUser = null;
                this.notifyListeners({ status: 'unauthenticated' });
            }
        });
    }



    /**
     * Sign in with Google
     * Tries Popup first, falls back to Redirect on failure (COOP/Mobile)
     */
    async signInWithGoogle(): Promise<UserProfile | void> {
        // Platform check: Use Native Plugin on Mobile
        if (Capacitor.isNativePlatform()) {
            try {
                // Use Capacitor Firebase Authentication plugin
                const result = await FirebaseAuthentication.signInWithGoogle();

                if (result.credential?.idToken) {
                    // Create Firebase credential from the Google ID token
                    const credential = GoogleAuthProvider.credential(result.credential.idToken);

                    // Sign in to Firebase with the credential
                    const firebaseResult = await signInWithCredential(auth, credential);
                    return this.handleAuthSuccess(firebaseResult);
                }

                throw new Error('No ID token received from Google Sign-In');
            } catch (error) {
                console.error("Native Google Sign-In Error:", error);
                throw error;
            }
        }

        // Web Fallback
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            // Try popup first (Better UX)
            const credential = await signInWithPopup(auth, provider);
            return this.handleAuthSuccess(credential);
        } catch (error: any) {
            console.warn('Google Sign-In Popup failed, trying Redirect...', error.code, error.message);

            // If popup blocked or COOP error, try redirect
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request' || error.message.includes('Cross-Origin-Opener-Policy')) {
                await signInWithRedirect(auth, provider);
                // Function ends here, page will redirect
                return;
            }

            // Handle other errors normally
            console.error('Google Sign-In Error:', error);
            if (error.code === 'auth/unauthorized-domain') {
                throw new Error('Domain not authorized in Firebase Console.');
            } else if (error.code === 'auth/operation-not-allowed') {
                throw new Error('Google Sign-In not enabled in Firebase Console.');
            } else {
                throw error;
            }
        }
    }

    /**
     * Handle successful authentication
     */
    private async handleAuthSuccess(credential: UserCredential): Promise<UserProfile> {
        const { user } = credential;

        // Check if profile exists
        let profile = await this.getUserProfile(user.uid);
        let isExistingUser = false;

        if (!profile) {
            // Create new profile
            profile = await this.createUserProfile(user);
        } else {
            // Existing user - mark them so we skip onboarding
            isExistingUser = true;
        }

        // For existing users on a new device, auto-complete onboarding
        // ONLY if profile has gender
        if (isExistingUser && profile.gender) {
            const { onboardingService } = await import('./OnboardingService');
            if (!onboardingService.isOnboardingComplete()) {
                console.log('[AuthService] Existing user detected (with gender) - auto-completing onboarding');
                onboardingService.markGoogleLinked();
                onboardingService.completeOnboarding();
            }
        }

        this.currentUser = profile;
        return profile;
    }

    /**
     * Create user profile in Firestore
     */
    private async createUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
        const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: new Date(),
            updatedAt: new Date(),
            premium: false,
            premiumExpiresAt: null,
            settings: DEFAULT_USER_SETTINGS,
            stats: DEFAULT_USER_STATS,
        };

        // Save to Firestore
        const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
        await setDoc(userRef, {
            ...profile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });

        return profile;
    }

    /**
     * Get user profile from Firestore
     */
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                // Helper to safely parse dates (Timestamp or String or Date)
                const parseDate = (val: any): Date => {
                    if (!val) return new Date();
                    if (val.toDate && typeof val.toDate === 'function') return val.toDate();
                    if (val instanceof Date) return val;
                    if (typeof val === 'string') return new Date(val);
                    return new Date();
                };

                return {
                    ...data,
                    uid,
                    gender: data.gender,
                    createdAt: parseDate(data.createdAt),
                    updatedAt: parseDate(data.updatedAt),
                    premiumExpiresAt: data.premiumExpiresAt ? parseDate(data.premiumExpiresAt) : null,
                    stats: {
                        ...DEFAULT_USER_STATS,
                        ...data.stats,
                        lastPrayerDate: data.stats?.lastPrayerDate ? parseDate(data.stats.lastPrayerDate) : null,
                    },
                } as UserProfile;
            }

            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(updates: Partial<UserProfile>): Promise<void> {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        const userRef = doc(db, USERS_COLLECTION, this.currentUser.uid);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });

        // Update local state
        this.currentUser = { ...this.currentUser, ...updates, updatedAt: new Date() };
        this.notifyListeners({ status: 'authenticated', user: this.currentUser });
        this.currentUser = { ...this.currentUser, ...updates, updatedAt: new Date() };
        this.notifyListeners({ status: 'authenticated', user: this.currentUser });
    }

    /**
     * Upload avatar image
     */
    async uploadAvatar(file: File): Promise<string> {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/${this.currentUser.uid}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        await this.updateProfile({ photoURL: downloadURL });
        return downloadURL;
    }

    /**
     * Update user settings
     */
    async updateSettings(settings: Partial<UserSettings>): Promise<void> {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        const updatedSettings = { ...this.currentUser.settings, ...settings };
        await this.updateProfile({ settings: updatedSettings });
    }

    /**
     * Sign out
     */
    async signOut(): Promise<void> {
        await firebaseSignOut(auth);
        this.currentUser = null;
    }



    /**
     * Get current user
     */
    getCurrentUser(): UserProfile | null {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    /**
     * Subscribe to auth state changes
     */
    subscribe(listener: (state: AuthState) => void): () => void {
        this.authStateListeners.add(listener);

        // Immediately notify with current state
        if (this.currentUser) {
            listener({ status: 'authenticated', user: this.currentUser });
        } else if (auth.currentUser === null) {
            listener({ status: 'unauthenticated' });
        } else {
            listener({ status: 'loading' });
        }

        return () => this.authStateListeners.delete(listener);
    }

    /**
     * Notify all listeners of auth state change
     */
    private notifyListeners(state: AuthState): void {
        this.authStateListeners.forEach(listener => listener(state));
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
        }
    }
}

// Export singleton instance
export const authService = new AuthService();
