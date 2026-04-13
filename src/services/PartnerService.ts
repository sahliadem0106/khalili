/**
 * PartnerService - Real partner connections via Firebase
 */

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    or,
} from 'firebase/firestore';
import { db } from './firebase';

// =================== TYPES ===================

export type PartnershipStatus = 'pending' | 'accepted' | 'blocked';
export type ShareLevel = 'minimal' | 'standard' | 'full';

export interface Partner {
    partnershipId: string;
    odUserId: string;
    odUserName: string;
    odUserPhoto: string | null;
    shareLevel: ShareLevel;
    status: PartnershipStatus;
    currentStreak: number;
    todayStatus: {
        fajr: boolean;
        dhuhr: boolean;
        asr: boolean;
        maghrib: boolean;
        isha: boolean;
    };
    lastActive: Date | null;
    createdAt: Date;
}

export interface PartnerRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserPhoto: string | null;
    toUserId: string;
    message: string | null;
    status: PartnershipStatus;
    createdAt: Date;
}

export interface Partnership {
    id: string;
    user1Id: string;
    user2Id: string;
    user1ShareLevel: ShareLevel;
    user2ShareLevel: ShareLevel;
    status: PartnershipStatus;
    createdAt: Date;
    updatedAt: Date;
}

// =================== CONSTANTS ===================

const PARTNERSHIPS_COLLECTION = 'partnerships';
const PARTNER_REQUESTS_COLLECTION = 'partnerRequests';

// =================== SERVICE CLASS ===================

class PartnerService {
    private userId: string | null = null;
    private unsubscribers: (() => void)[] = [];
    private partnersListeners: Set<(partners: Partner[]) => void> = new Set();
    private requestsListeners: Set<(requests: PartnerRequest[]) => void> = new Set();

    /**
     * Set current user ID
     */
    setUserId(userId: string | null): void {
        this.userId = userId;

        // Cleanup existing listeners
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        // Setup new listeners if authenticated
        if (userId) {
            this.setupRealtimeListeners();
        }
    }

    /**
     * Setup real-time listeners for partnerships
     */
    private setupRealtimeListeners(): void {
        if (!this.userId) return;

        // Listen to partnerships where user is involved
        const partnershipsQuery = query(
            collection(db, PARTNERSHIPS_COLLECTION),
            or(
                where('user1Id', '==', this.userId),
                where('user2Id', '==', this.userId)
            )
        );

        const unsubPartnerships = onSnapshot(partnershipsQuery, async (snapshot) => {
            const partners: Partner[] = [];

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                if (data.status !== 'accepted') continue;

                const partnerId = data.user1Id === this.userId ? data.user2Id : data.user1Id;
                const partnerShareLevel = data.user1Id === this.userId
                    ? data.user2ShareLevel
                    : data.user1ShareLevel;

                // Get partner profile
                const partnerProfile = await this.getPartnerProfile(partnerId);

                if (partnerProfile) {
                    partners.push({
                        partnershipId: docSnap.id,
                        odUserId: partnerId,
                        odUserName: partnerProfile.displayName || 'Anonymous',
                        odUserPhoto: partnerProfile.photoURL,
                        shareLevel: partnerShareLevel,
                        status: data.status,
                        currentStreak: partnerProfile.stats?.currentStreak || 0,
                        todayStatus: await this.getPartnerTodayStatus(partnerId),
                        lastActive: partnerProfile.lastActive,
                        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                    });
                }
            }

            this.notifyPartnersListeners(partners);
        });

        this.unsubscribers.push(unsubPartnerships);

        // Listen to pending requests
        const requestsQuery = query(
            collection(db, PARTNER_REQUESTS_COLLECTION),
            where('toUserId', '==', this.userId),
            where('status', '==', 'pending')
        );

        const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
            const requests: PartnerRequest[] = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    fromUserId: data.fromUserId,
                    fromUserName: data.fromUserName,
                    fromUserPhoto: data.fromUserPhoto,
                    toUserId: data.toUserId,
                    message: data.message,
                    status: data.status,
                    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                };
            });

            this.notifyRequestsListeners(requests);
        });

        this.unsubscribers.push(unsubRequests);
    }

    /**
     * Send partner request
     */
    async sendPartnerRequest(toUserId: string, message?: string): Promise<void> {
        if (!this.userId) throw new Error('Not authenticated');

        // Get current user profile
        const userDoc = await getDoc(doc(db, 'users', this.userId));
        const userData = userDoc.data();

        const requestRef = doc(collection(db, PARTNER_REQUESTS_COLLECTION));
        await setDoc(requestRef, {
            fromUserId: this.userId,
            fromUserName: userData?.displayName || 'User',
            fromUserPhoto: userData?.photoURL || null,
            toUserId,
            message: message || null,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
    }

    /**
     * Accept partner request
     */
    async acceptRequest(requestId: string): Promise<void> {
        if (!this.userId) throw new Error('Not authenticated');

        const requestRef = doc(db, PARTNER_REQUESTS_COLLECTION, requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) throw new Error('Request not found');

        const requestData = requestDoc.data();

        // Create partnership
        const partnershipRef = doc(collection(db, PARTNERSHIPS_COLLECTION));
        await setDoc(partnershipRef, {
            user1Id: requestData.fromUserId,
            user2Id: this.userId,
            user1ShareLevel: 'standard',
            user2ShareLevel: 'standard',
            status: 'accepted',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Update request status
        await updateDoc(requestRef, { status: 'accepted' });
    }

    /**
     * Decline partner request
     */
    async declineRequest(requestId: string): Promise<void> {
        if (!this.userId) throw new Error('Not authenticated');

        const requestRef = doc(db, PARTNER_REQUESTS_COLLECTION, requestId);
        await deleteDoc(requestRef);
    }

    /**
     * Remove partner
     */
    async removePartner(partnershipId: string): Promise<void> {
        if (!this.userId) throw new Error('Not authenticated');

        const partnershipRef = doc(db, PARTNERSHIPS_COLLECTION, partnershipId);
        await deleteDoc(partnershipRef);
    }

    /**
     * Update share level with partner
     */
    async updateShareLevel(partnershipId: string, shareLevel: ShareLevel): Promise<void> {
        if (!this.userId) throw new Error('Not authenticated');

        const partnershipRef = doc(db, PARTNERSHIPS_COLLECTION, partnershipId);
        const partnershipDoc = await getDoc(partnershipRef);

        if (!partnershipDoc.exists()) throw new Error('Partnership not found');

        const data = partnershipDoc.data();
        const updateField = data.user1Id === this.userId ? 'user1ShareLevel' : 'user2ShareLevel';

        await updateDoc(partnershipRef, {
            [updateField]: shareLevel,
            updatedAt: serverTimestamp(),
        });
    }

    /**
     * Get partner's basic profile
     */
    private async getPartnerProfile(userId: string): Promise<any> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return userDoc.exists() ? userDoc.data() : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Get partner's today prayer status (simplified)
     */
    private async getPartnerTodayStatus(userId: string): Promise<Partner['todayStatus']> {
        // This would fetch from prayerLogs subcollection based on share level
        // For now, return default
        return {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false,
        };
    }

    /**
     * Generate invite link/code
     */
    generateInviteCode(): string {
        if (!this.userId) throw new Error('Not authenticated');
        // Simple encoding of user ID
        return btoa(this.userId).replace(/=/g, '');
    }

    /**
     * Parse invite code
     */
    parseInviteCode(code: string): string | null {
        try {
            return atob(code + '=='.slice(0, (4 - code.length % 4) % 4));
        } catch {
            return null;
        }
    }

    /**
     * Subscribe to partners list changes
     */
    subscribeToPartners(listener: (partners: Partner[]) => void): () => void {
        this.partnersListeners.add(listener);
        return () => this.partnersListeners.delete(listener);
    }

    /**
     * Subscribe to partner requests
     */
    subscribeToRequests(listener: (requests: PartnerRequest[]) => void): () => void {
        this.requestsListeners.add(listener);
        return () => this.requestsListeners.delete(listener);
    }

    private notifyPartnersListeners(partners: Partner[]): void {
        this.partnersListeners.forEach(listener => listener(partners));
    }

    private notifyRequestsListeners(requests: PartnerRequest[]): void {
        this.requestsListeners.forEach(listener => listener(requests));
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }
}

// Export singleton
export const partnerService = new PartnerService();
