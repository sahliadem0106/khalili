
import {
    collection,
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    Timestamp,
    arrayUnion,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { PartnerProfile, Partnership, PartnerRequest, RequestType, SocialShareRequest, PartnerNotification } from '../types/partner';
import { socialNotificationPolicyService } from './SocialNotificationPolicyService';
import { CRITICAL_LIVE_NOTIFICATION_TYPES, CriticalLiveNotificationType } from '../constants/notificationTypes';
import { planLimitService } from './PlanLimitService';

const updateSocialBadgeStat = (metric: 'partners_connected' | 'circles_joined', value: number): void => {
    import('./BadgeService')
        .then(({ BadgeService }) => {
            BadgeService.updateStat(metric, value);
        })
        .catch((error) => {
            console.error(`Failed to update ${metric} badge stat:`, error);
        });
};

const PARTNER_REQUEST_NOTIFICATION_TYPE: CriticalLiveNotificationType =
    CRITICAL_LIVE_NOTIFICATION_TYPES[0];

// Helper to generate random QR code ID
const generateRandomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const PartnerService = {
    // --- Profile Management ---

    async createOrUpdateProfile(userId: string, profileData: Partial<PartnerProfile>) {
        const profileRef = doc(db, 'partnerProfiles', userId);

        // Generate QR code ID if not exists
        const existingProfile = await getDoc(profileRef);
        const qrCodeId = existingProfile.exists() && existingProfile.data().qrCodeId
            ? existingProfile.data().qrCodeId
            : generateRandomId();

        await setDoc(profileRef, {
            ...profileData,
            userId,
            qrCodeId,
            lastActive: Timestamp.now(),
        }, { merge: true });

        return qrCodeId;
    },

    // --- Group Management ---
    async getUserGroup(userId: string, type: 'family' | 'suhba') {
        const q = query(
            collection(db, 'groups'),
            where('members', 'array-contains', userId),
            where('type', '==', type)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },

    // --- Adhan Reminders ---
    async sendAdhanReminder(senderId: string, recipientIds: string | string[], prayerName: string) {
        try {
            const ids = Array.isArray(recipientIds) ? recipientIds : [recipientIds];
            const limitCheck = await planLimitService.consume(senderId, 'social_policies_created_per_day', ids.length);
            if (!limitCheck.allowed) {
                throw new Error('Daily reminder limit reached. Please try again tomorrow.');
            }

            const batch = ids.map((id) =>
                socialNotificationPolicyService.createPrayerReminderPolicy(
                    senderId,
                    'partner',
                    { type: 'user', userIds: [id] },
                    prayerName as any,
                    `Time for ${prayerName} prayer! Let's pray together.`
                )
            );

            await Promise.all(batch);
            return true;
        } catch (error) {
            console.error('Error sending adhan reminder:', error);
            return false;
        }
    },

    async getProfile(userId: string): Promise<PartnerProfile | null> {
        const profileRef = doc(db, 'partnerProfiles', userId);
        const snap = await getDoc(profileRef);
        return snap.exists() ? (snap.data() as PartnerProfile) : null;
    },

    // --- QR Code System ---

    async getProfileByQRCode(qrCodeId: string): Promise<PartnerProfile | null> {
        const q = query(
            collection(db, 'partnerProfiles'),
            where('qrCodeId', '==', qrCodeId.toUpperCase())
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as PartnerProfile;
    },

    async getUserQRCode(userId: string): Promise<string | null> {
        const profile = await this.getProfile(userId);
        return profile?.qrCodeId || null;
    },

    // --- Marketplace ("Lost Lamb") ---

    async searchPublicProfiles(filters: {
        gender: 'male' | 'female';
        minAge?: number;
        maxAge?: number;
        country?: string;
        city?: string;
        hobbies?: string[];
        maxDistanceKm?: number;
        userLocation?: { lat: number; lon: number };
    }): Promise<PartnerProfile[]> {
        const profilesRef = collection(db, 'partnerProfiles');
        let q = query(
            profilesRef,
            where('isPublic', '==', true),
            where('gender', '==', filters.gender)
        );

        const snapshot = await getDocs(q);
        let profiles = snapshot.docs.map(d => d.data() as PartnerProfile);

        // Filter partnered users when permitted. Marketplace reads can run
        // without partnerships access depending on security rules state.
        try {
            const partnershipsSnapshot = await getDocs(
                query(collection(db, 'partnerships'), where('status', '==', 'active'))
            );
            const partneredUserIds = new Set<string>();
            partnershipsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.users) {
                    data.users.forEach((uid: string) => partneredUserIds.add(uid));
                }
            });

            profiles = profiles.filter(p => !partneredUserIds.has(p.userId));
        } catch (error) {
            console.warn('Skipping partnership exclusion due to restricted access:', error);
        }

        // Client-side filtering for additional criteria
        if (filters.minAge) {
            profiles = profiles.filter(p => p.age >= filters.minAge!);
        }
        if (filters.maxAge) {
            profiles = profiles.filter(p => p.age <= filters.maxAge!);
        }
        if (filters.country) {
            profiles = profiles.filter(p => p.location.country.toLowerCase() === filters.country!.toLowerCase());
        }
        if (filters.city) {
            profiles = profiles.filter(p => p.location.city.toLowerCase().includes(filters.city!.toLowerCase()));
        }
        if (filters.hobbies && filters.hobbies.length > 0) {
            profiles = profiles.filter(p =>
                p.hobbies?.some(h => filters.hobbies!.includes(h.toLowerCase()))
            );
        }

        // Distance filtering using Haversine formula
        if (filters.maxDistanceKm && filters.userLocation) {
            const { lat: userLat, lon: userLon } = filters.userLocation;

            // Haversine distance calculation
            const toRad = (deg: number) => deg * (Math.PI / 180);
            const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                const R = 6371; // Earth's radius in km
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            profiles = profiles.filter(p => {
                if (!p.location?.latitude || !p.location?.longitude) return false;
                const distance = haversineDistance(userLat, userLon, p.location.latitude, p.location.longitude);
                return distance <= filters.maxDistanceKm!;
            });
        }

        return profiles;
    },

    // --- Requests System ---

    async sendRequest(fromUserId: string, toUserId: string, type: RequestType = 'duo', details?: any) {
        // Prevent self-request
        if (fromUserId === toUserId) throw new Error("Cannot send request to yourself");
        const limitCheck = await planLimitService.consume(fromUserId, 'partner_requests_per_day');
        if (!limitCheck.allowed) {
            throw new Error('Daily partner request limit reached. Please try again tomorrow.');
        }

        // Check for existing pending request
        const q = query(
            collection(db, 'requests'),
            where('fromUserId', '==', fromUserId),
            where('toUserId', '==', toUserId),
            where('type', '==', type),
            where('status', '==', 'pending')
        );
        const existing = await getDocs(q);
        if (!existing.empty) throw new Error("Request already pending");

        // For duo, also check if partnership already exists
        if (type === 'duo') {
            const existingPartnership = await this.checkExistingPartnership(fromUserId, toUserId);
            if (existingPartnership) throw new Error("Partnership already exists");
        }

        // Create the request
        const requestRef = await addDoc(collection(db, 'requests'), {
            fromUserId,
            toUserId,
            type,
            status: 'pending',
            timestamp: Timestamp.now(),
            details: details || {}
        });

        // Get sender's profile for notification
        const senderProfile = await this.getProfile(fromUserId);
        const senderName = senderProfile?.nickname || 'Someone';

        // Create notification for recipient
        await addDoc(collection(db, 'notifications'), {
            type: PARTNER_REQUEST_NOTIFICATION_TYPE,
            fromUserId,
            toUserId,
            message: `${senderName} wants to connect with you as a partner`,
            requestId: requestRef.id,
            requestType: type,
            timestamp: Timestamp.now(),
            read: false,
            delivered: false
        });
    },

    async sendConnectionViaQR(fromUserId: string, qrCodeId: string): Promise<void> {
        const targetProfile = await this.getProfileByQRCode(qrCodeId);
        if (!targetProfile) throw new Error("Invalid QR code or user not found");

        await this.sendRequest(fromUserId, targetProfile.userId, 'duo');
    },

    async getIncomingRequests(userId: string): Promise<PartnerRequest[]> {
        const q = query(
            collection(db, 'requests'),
            where('toUserId', '==', userId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);

        // Hydrate with sender profile
        const requests = await Promise.all(snapshot.docs.map(async d => {
            const data = d.data();
            const fromProfile = await this.getProfile(data.fromUserId);
            return {
                id: d.id,
                ...data,
                fromUserData: fromProfile
            } as PartnerRequest;
        }));

        return requests;
    },

    async respondToRequest(requestId: string, action: 'accept' | 'reject') {
        const reqRef = doc(db, 'requests', requestId);
        const reqSnap = await getDoc(reqRef);
        if (!reqSnap.exists()) throw new Error("Request not found");

        const reqData = reqSnap.data() as PartnerRequest;

        if (action === 'reject') {
            await updateDoc(reqRef, { status: 'rejected' });
            return;
        }

        // Accept Logic
        if (reqData.type === 'duo') {
            await addDoc(collection(db, 'partnerships'), {
                users: [reqData.fromUserId, reqData.toUserId],
                status: 'active',
                startDate: Timestamp.now(),
                stats: {
                    [reqData.fromUserId]: { currentStreak: 0, lastPrayed: '', totalPrayersLogged: 0 },
                    [reqData.toUserId]: { currentStreak: 0, lastPrayed: '', totalPrayersLogged: 0 }
                },
                socialShareStatus: {}
            });
            updateSocialBadgeStat('partners_connected', 1);
        } else if (reqData.type === 'family' && reqData.details?.groupId) {
            const groupRef = doc(db, 'groups', reqData.details.groupId);
            await updateDoc(groupRef, {
                members: arrayUnion(reqData.toUserId),
                [`memberDetails.${reqData.toUserId}`]: {
                    userId: reqData.toUserId,
                    role: 'child',
                    joinedAt: Timestamp.now()
                }
            });
        } else if (reqData.type === 'suhba' && reqData.details?.groupId) {
            const groupRef = doc(db, 'groups', reqData.details.groupId);
            await updateDoc(groupRef, { members: arrayUnion(reqData.toUserId) });
        }

        await updateDoc(reqRef, { status: 'accepted' });
    },

    // --- Partnership Logic ---

    async checkExistingPartnership(user1: string, user2: string): Promise<boolean> {
        const partnerships = await this.getMyPartnerships(user1);
        return partnerships.some(p => p.users.includes(user2));
    },

    async getActivePartnership(userId: string): Promise<Partnership | null> {
        const q = query(
            collection(db, 'partnerships'),
            where('users', 'array-contains', userId),
            where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Partnership;
    },

    async getMyPartnerships(userId: string): Promise<Partnership[]> {
        const q = query(
            collection(db, 'partnerships'),
            where('users', 'array-contains', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Partnership));
    },

    async disconnectPartner(partnershipId: string, userId: string): Promise<void> {
        const partnershipRef = doc(db, 'partnerships', partnershipId);
        await updateDoc(partnershipRef, {
            status: 'ended',
            endedBy: userId,
            endedAt: Timestamp.now()
        });
    },

    // Real-time listener for partner stats
    subscribeToPartnership(partnershipId: string, callback: (partnership: Partnership) => void): () => void {
        const partnershipRef = doc(db, 'partnerships', partnershipId);
        return onSnapshot(partnershipRef, (snap) => {
            if (snap.exists()) {
                callback({ id: snap.id, ...snap.data() } as Partnership);
            }
        });
    },

    async updateMyStats(partnershipId: string, userId: string, stats: Partial<Partnership['stats'][string]>) {
        const partnershipRef = doc(db, 'partnerships', partnershipId);
        await updateDoc(partnershipRef, {
            [`stats.${userId}`]: stats
        });
    },

    // --- Custom Reminders ---

    async sendCustomReminder(partnershipId: string, fromUserId: string, toUserId: string, message: string) {
        const limitCheck = await planLimitService.consume(fromUserId, 'social_policies_created_per_day');
        if (!limitCheck.allowed) {
            throw new Error('Daily reminder limit reached. Please try again tomorrow.');
        }
        await socialNotificationPolicyService.createOneTimePolicy(
            fromUserId,
            'partner',
            { type: 'partnership', partnershipId },
            'Partner Reminder',
            message,
            new Date(Date.now() + 60 * 1000)
        );
    },

    async getMyNotifications(userId: string): Promise<PartnerNotification[]> {
        const q = query(
            collection(db, 'notifications'),
            where('toUserId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PartnerNotification));
    },

    async markNotificationRead(notificationId: string) {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, { read: true });
    },

    // --- Social Share System (3-day rule) ---

    async canRequestSocialShare(partnershipId: string): Promise<boolean> {
        const partnershipRef = doc(db, 'partnerships', partnershipId);
        const snap = await getDoc(partnershipRef);
        if (!snap.exists()) return false;

        const partnership = snap.data() as Partnership;
        const startDate = partnership.startDate.toDate();
        const daysSinceStart = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        return daysSinceStart >= 3;
    },

    async sendSocialShareRequest(partnershipId: string, fromUserId: string, message?: string) {
        const canRequest = await this.canRequestSocialShare(partnershipId);
        if (!canRequest) throw new Error("Must be partners for at least 3 days");

        // Get partner's user ID
        const partnershipRef = doc(db, 'partnerships', partnershipId);
        const snap = await getDoc(partnershipRef);
        if (!snap.exists()) throw new Error("Partnership not found");

        const partnership = snap.data() as Partnership;
        const toUserId = partnership.users.find(u => u !== fromUserId);
        if (!toUserId) throw new Error("Partner not found");

        // Check for existing pending request
        const q = query(
            collection(db, 'socialShareRequests'),
            where('partnershipId', '==', partnershipId),
            where('fromUserId', '==', fromUserId),
            where('status', '==', 'pending')
        );
        const existing = await getDocs(q);
        if (!existing.empty) throw new Error("Social share request already pending");

        await addDoc(collection(db, 'socialShareRequests'), {
            partnershipId,
            fromUserId,
            toUserId,
            status: 'pending',
            message: message || "Let's connect on social media!",
            timestamp: Timestamp.now()
        });

        // Update partnership
        await updateDoc(partnershipRef, {
            'socialShareStatus.requestedBy': fromUserId,
            'socialShareStatus.requestedAt': Timestamp.now()
        });
    },

    async getSocialShareRequests(userId: string): Promise<SocialShareRequest[]> {
        const q = query(
            collection(db, 'socialShareRequests'),
            where('toUserId', '==', userId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SocialShareRequest));
    },

    async respondToSocialShareRequest(requestId: string, action: 'accept' | 'dismiss') {
        const reqRef = doc(db, 'socialShareRequests', requestId);
        const reqSnap = await getDoc(reqRef);
        if (!reqSnap.exists()) throw new Error("Social share request not found");

        const reqData = reqSnap.data() as SocialShareRequest;

        if (action === 'dismiss') {
            await updateDoc(reqRef, { status: 'dismissed' });
            return;
        }

        // Accept: update both request and partnership
        await updateDoc(reqRef, { status: 'accepted' });

        const partnershipRef = doc(db, 'partnerships', reqData.partnershipId);
        await updateDoc(partnershipRef, {
            'socialShareStatus.acceptedBy': arrayUnion(reqData.toUserId)
        });
    },

    // Check if social share was accepted (for showing confirmation message)
    async checkSocialShareAccepted(partnershipId: string, userId: string): Promise<boolean> {
        const partnershipRef = doc(db, 'partnerships', partnershipId);
        const snap = await getDoc(partnershipRef);
        if (!snap.exists()) return false;

        const partnership = snap.data() as Partnership;
        const acceptedBy = partnership.socialShareStatus?.acceptedBy || [];
        return acceptedBy.some(id => id !== userId);
    }
};
