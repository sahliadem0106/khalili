/**
 * AuthService - Firebase Authentication service
 * Handles user authentication, profile management, and session state
 */

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification,
    User as FirebaseUser,
    UserCredential,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { onboardingService } from '../../services/OnboardingService';

// =================== TYPES ===================

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
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
     * Initialize Firebase auth state listener
     */
    private initAuthListener(): void {
        if (typeof window === 'undefined') return;

        this.unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const profile = await this.getUserProfile(firebaseUser.uid);
                    if (profile) {
                        this.currentUser = profile;
                        this.notifyListeners({ status: 'authenticated', user: profile });
                    } else {
                        // Create profile if doesn't exist
                        const newProfile = await this.createUserProfile(firebaseUser);
                        this.currentUser = newProfile;
                        this.notifyListeners({ status: 'authenticated', user: newProfile });
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    this.notifyListeners({ status: 'unauthenticated' });
                }
            } else {
                this.currentUser = null;
                this.notifyListeners({ status: 'unauthenticated' });
            }
        });
    }

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email: string, password: string): Promise<UserProfile> {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return this.handleAuthSuccess(credential);
    }

    /**
     * Sign up with email and password
     */
    async signUpWithEmail(email: string, password: string, displayName?: string): Promise<UserProfile> {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        // Update display name if provided
        if (displayName && credential.user) {
            await updateProfile(credential.user, { displayName });
        }

        // Send email verification
        if (credential.user) {
            await sendEmailVerification(credential.user);
        }

        return this.handleAuthSuccess(credential);
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle(): Promise<UserProfile> {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        const credential = await signInWithPopup(auth, provider);
        return this.handleAuthSuccess(credential);
    }

    /**
     * Handle successful authentication
     */
    private async handleAuthSuccess(credential: UserCredential): Promise<UserProfile> {
        const { user } = credential;

        // Check if profile exists
        let profile = await this.getUserProfile(user.uid);

        if (!profile) {
            // Create new profile
            profile = await this.createUserProfile(user);
        }

        this.currentUser = profile;
        return profile;
    }



    /**
     * Create user profile in Firestore
     */
    private async createUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
        // Determine avatar based on gender if available
        const gender = onboardingService.getGender();
        let initialPhotoURL = firebaseUser.photoURL;

        if (gender === 'female') {
            initialPhotoURL = '/womenicon.png';
        } else if (gender === 'male') {
            initialPhotoURL = '/manicon.png';
        }

        const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: initialPhotoURL,
            createdAt: new Date(),
            updatedAt: new Date(),
            premium: false,
            premiumExpiresAt: null,
            settings: DEFAULT_USER_SETTINGS,
            stats: DEFAULT_USER_STATS,
        };

        // FORCE Firebase Auth Profile Update to replace Google photo
        try {
            if (initialPhotoURL && initialPhotoURL !== firebaseUser.photoURL) {
                await updateProfile(firebaseUser, { photoURL: initialPhotoURL });
            }
        } catch (e) {
            console.error("Failed to update Firebase Auth profile photo", e);
        }

        // Save to Firestore
        const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
        await setDoc(userRef, {
            ...profile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

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
                return {
                    ...data,
                    uid,
                    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
                    premiumExpiresAt: data.premiumExpiresAt
                        ? (data.premiumExpiresAt as Timestamp).toDate()
                        : null,
                    stats: {
                        ...DEFAULT_USER_STATS,
                        ...data.stats,
                        lastPrayerDate: data.stats?.lastPrayerDate
                            ? (data.stats.lastPrayerDate as Timestamp).toDate()
                            : null,
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
     * Send password reset email
     */
    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email);
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
