/**
 * PushNotificationService - Handle Firebase Cloud Messaging (FCM) for mobile push
 * 
 * SETUP REQUIRED:
 * 1. Run: npm install @capacitor/push-notifications
 * 2. Run: npx cap sync
 * 3. Add google-services.json to android/app/
 * 4. Deploy Cloud Function to send notifications
 */

import { doc, updateDoc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface PushNotificationToken {
    token: string;
    platform: 'android' | 'ios' | 'web';
    createdAt: Date;
    updatedAt: Date;
}

class PushNotificationService {
    private token: string | null = null;
    private isRegistered = false;

    /**
     * Check if push notifications plugin is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            // Dynamic import to avoid errors if not installed
            const { PushNotifications } = await import('@capacitor/push-notifications');
            return !!PushNotifications;
        } catch {
            console.log('[Push] Push notifications plugin not installed');
            return false;
        }
    }

    /**
     * Request permission and register for push notifications
     */
    async register(userId: string): Promise<boolean> {
        if (this.isRegistered) return true;

        try {
            const { PushNotifications } = await import('@capacitor/push-notifications');
            const { Capacitor } = await import('@capacitor/core');

            // Only works on native platforms
            if (!Capacitor.isNativePlatform()) {
                console.log('[Push] Not a native platform, skipping push registration');
                return false;
            }

            // Request permission
            const permResult = await PushNotifications.requestPermissions();
            if (permResult.receive !== 'granted') {
                console.log('[Push] Permission denied');
                return false;
            }

            // Register for push
            await PushNotifications.register();

            // Listen for registration success
            PushNotifications.addListener('registration', async (token) => {
                console.log('[Push] Registration successful:', token.value);
                this.token = token.value;
                await this.saveTokenToFirestore(userId, token.value, 'android');
            });

            // Listen for registration errors
            PushNotifications.addListener('registrationError', (error) => {
                console.error('[Push] Registration error:', error);
            });

            // Listen for incoming notifications when app is open
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('[Push] Notification received:', notification);
                // Show in-app notification or handle as needed
            });

            // Listen for notification tap
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                console.log('[Push] Action performed:', action);
                // Navigate to relevant screen based on action.notification.data
            });

            this.isRegistered = true;
            return true;
        } catch (error) {
            console.error('[Push] Registration failed:', error);
            return false;
        }
    }

    /**
     * Save FCM token to Firestore for the user
     */
    async saveTokenToFirestore(
        userId: string,
        token: string,
        platform: 'android' | 'ios' | 'web'
    ): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            const tokenData = {
                fcmTokens: arrayUnion(token),
                fcmToken: token,
                fcmPlatform: platform,
                fcmUpdatedAt: new Date().toISOString(),
            };

            if (userDoc.exists()) {
                await updateDoc(userRef, tokenData);
            } else {
                await setDoc(userRef, tokenData, { merge: true });
            }

            console.log('[Push] Token saved to Firestore');
        } catch (error) {
            console.error('[Push] Failed to save token:', error);
        }
    }

    /**
     * Get the current FCM token
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * Unregister from push notifications (e.g., on logout)
     */
    async unregister(userId: string): Promise<void> {
        try {
            // Remove token from Firestore
            const userRef = doc(db, 'users', userId);
            
            if (this.token) {
                await updateDoc(userRef, {
                    fcmTokens: arrayRemove(this.token),
                    fcmToken: null,
                    fcmPlatform: null,
                });
            } else {
                await updateDoc(userRef, {
                    fcmToken: null,
                    fcmPlatform: null,
                });
            }

            // Unregister from Capacitor
            const { PushNotifications } = await import('@capacitor/push-notifications');
            await PushNotifications.removeAllListeners();

            this.token = null;
            this.isRegistered = false;
            console.log('[Push] Unregistered successfully');
        } catch (error) {
            console.error('[Push] Unregister failed:', error);
        }
    }
}

export const pushNotificationService = new PushNotificationService();
