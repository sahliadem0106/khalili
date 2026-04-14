
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    query,
    where,
    getDocs,
    Timestamp,
    getDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { SuhbaCircle, PartnerNotification } from '../types/partner';
import { socialNotificationPolicyService } from './SocialNotificationPolicyService';
import { planLimitService } from './PlanLimitService';

const updateCircleBadgeStat = (value: number): void => {
    import('./BadgeService')
        .then(({ BadgeService }) => {
            BadgeService.updateStat('circles_joined', value);
        })
        .catch((error) => {
            console.error('Failed to update circles_joined badge stat:', error);
        });
};

// Helper to generate random invite code
const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'SUH-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export interface Broadcast {
    id: string;
    circleId: string;
    fromUserId: string;
    message: string;
    actionType: 'pray' | 'adhkar' | 'dhikr' | 'custom';
    targetId?: string;
    customDhikr?: string;
    timestamp: Timestamp;
}

export const SuhbaService = {
    // --- Circle Creation (with payment check) ---

    async createCircle(
        adminId: string,
        name: string,
        description: string,
        isPublic: boolean,
        isPaid: boolean = false,
        adminOnlyBroadcast: boolean = false
    ): Promise<string> {
        const circles = await this.getMyCircles(adminId);
        const owned = circles.filter(c => c.adminId === adminId);

        const maxCircles = isPaid ? 5 : 1;
        if (owned.length >= maxCircles) {
            throw new Error(`You can only create up to ${maxCircles} circle${maxCircles > 1 ? 's' : ''}.`);
        }

        const inviteCode = generateInviteCode();

        const docRef = await addDoc(collection(db, 'groups'), {
            adminId,
            coAdmins: [],
            name,
            description,
            isPublic,
            isPaid,
            adminOnlyBroadcast,
            inviteCode,
            createdAt: Timestamp.now(),
            members: [adminId],
            type: 'suhba'
        });
        updateCircleBadgeStat(1);
        return docRef.id;
    },

    async getCircle(circleId: string): Promise<SuhbaCircle | null> {
        const ref = doc(db, 'groups', circleId);
        const snap = await getDoc(ref);
        if (!snap.exists() || snap.data().type !== 'suhba') return null;
        return { id: snap.id, ...snap.data() } as SuhbaCircle;
    },

    async getMyCircles(userId: string): Promise<SuhbaCircle[]> {
        const q = query(
            collection(db, 'groups'),
            where('members', 'array-contains', userId),
            where('type', '==', 'suhba')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SuhbaCircle));
    },

    // --- Invite System ---

    async getInviteCode(circleId: string): Promise<string | null> {
        const circle = await this.getCircle(circleId);
        return circle?.inviteCode || null;
    },

    async findCircleByInviteCode(inviteCode: string): Promise<SuhbaCircle | null> {
        const q = query(
            collection(db, 'groups'),
            where('inviteCode', '==', inviteCode.toUpperCase()),
            where('type', '==', 'suhba')
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SuhbaCircle;
    },

    async joinViaInviteCode(inviteCode: string, userId: string): Promise<string> {
        const circle = await this.findCircleByInviteCode(inviteCode);
        if (!circle) throw new Error("Invalid invite code");

        if (circle.members.includes(userId)) {
            throw new Error("Already a member of this circle");
        }

        await this.joinCircle(circle.id, userId);
        return circle.id;
    },

    // --- Member Management ---

    async joinCircle(circleId: string, userId: string): Promise<void> {
        const circleRef = doc(db, 'groups', circleId);
        const snap = await getDoc(circleRef);
        if (!snap.exists()) throw new Error("Circle not found");

        await updateDoc(circleRef, { members: arrayUnion(userId) });
        updateCircleBadgeStat(1);
    },

    async leaveCircle(circleId: string, userId: string): Promise<void> {
        const circle = await this.getCircle(circleId);
        if (!circle) throw new Error("Circle not found");

        if (circle.adminId === userId) {
            throw new Error("Admin cannot leave the circle");
        }

        const circleRef = doc(db, 'groups', circleId);
        await updateDoc(circleRef, { members: arrayRemove(userId) });
    },

    async removeMember(circleId: string, requestingUserId: string, targetUserId: string): Promise<void> {
        const circle = await this.getCircle(circleId);
        if (!circle) throw new Error("Circle not found");

        if (circle.adminId !== requestingUserId) {
            throw new Error("Only the admin can remove members");
        }

        if (targetUserId === requestingUserId) {
            throw new Error("Admin cannot remove themselves");
        }

        const circleRef = doc(db, 'groups', circleId);
        await updateDoc(circleRef, {
            members: arrayRemove(targetUserId),
            coAdmins: arrayRemove(targetUserId)
        });
    },

    async addCoAdmin(circleId: string, requestingUserId: string, newCoAdminId: string): Promise<void> {
        const circle = await this.getCircle(circleId);
        if (!circle) throw new Error("Circle not found");

        if (circle.adminId !== requestingUserId) {
            throw new Error("Only the circle admin can add co-admins");
        }

        if (!circle.members.includes(newCoAdminId)) {
            throw new Error("User must be a circle member first");
        }

        if (newCoAdminId === circle.adminId || circle.coAdmins?.includes(newCoAdminId)) {
            throw new Error("User is already an admin");
        }

        const circleRef = doc(db, 'groups', circleId);
        await updateDoc(circleRef, { coAdmins: arrayUnion(newCoAdminId) });
    },

    // --- Broadcast System ---

    // Check if user can send broadcasts in a circle
    async canBroadcast(circleId: string, userId: string): Promise<boolean> {
        const circle = await this.getCircle(circleId);
        if (!circle) return false;
        if (!circle.members.includes(userId)) return false;

        // adminOnlyBroadcast is stored in the doc but may not be in the SuhbaCircle interface
        if ((circle as SuhbaCircle & { adminOnlyBroadcast?: boolean }).adminOnlyBroadcast) {
            const isAdmin = circle.adminId === userId;
            const isCoAdmin = circle.coAdmins?.includes(userId) || false;
            return isAdmin || isCoAdmin;
        }
        return true;
    },

    async sendBroadcast(
        circleId: string,
        fromUserId: string,
        message: string,
        actionType: 'pray' | 'adhkar' | 'dhikr' | 'custom',
        targetId?: string,
        customDhikr?: string
    ): Promise<string> {
        const circle = await this.getCircle(circleId);
        if (!circle) throw new Error("Circle not found");

        if (!circle.members.includes(fromUserId)) {
            throw new Error("Only circle members can send broadcasts");
        }

        // Check admin-only broadcast restriction
        if ((circle as SuhbaCircle & { adminOnlyBroadcast?: boolean }).adminOnlyBroadcast) {
            const isAdmin = circle.adminId === fromUserId;
            const isCoAdmin = circle.coAdmins?.includes(fromUserId) || false;
            if (!isAdmin && !isCoAdmin) {
                throw new Error("Only admins can send broadcasts in this circle");
            }
        }

        const limitCheck = await planLimitService.consume(fromUserId, 'suhba_broadcasts_per_day');
        if (!limitCheck.allowed) {
            throw new Error('Daily broadcast limit reached. Please try again tomorrow.');
        }

        // Build broadcast data without undefined values
        const broadcastData: Record<string, any> = {
            circleId,
            fromUserId,
            message,
            actionType,
            timestamp: Timestamp.now()
        };
        if (targetId) broadcastData.targetId = targetId;
        if (customDhikr) broadcastData.customDhikr = customDhikr;

        const broadcastRef = await addDoc(collection(db, 'broadcasts'), broadcastData);

        await socialNotificationPolicyService.createOneTimePolicy(
            fromUserId,
            'suhba',
            { type: 'group', groupId: circleId },
            'Circle Reminder',
            message,
            new Date(Date.now() + 60 * 1000)
        );

        return broadcastRef.id;
    },

    async getBroadcasts(circleId: string, limitCount: number = 20): Promise<Broadcast[]> {
        const q = query(
            collection(db, 'broadcasts'),
            where('circleId', '==', circleId)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Broadcast))
            .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
            .slice(0, limitCount);
    },

    async getRecentBroadcasts(userId: string, limitCount: number = 10): Promise<Broadcast[]> {
        const circles = await this.getMyCircles(userId);
        if (circles.length === 0) return [];

        const circleIds = circles.map(c => c.id);
        const limitedCircleIds = circleIds.slice(0, 10);

        const q = query(
            collection(db, 'broadcasts'),
            where('circleId', 'in', limitedCircleIds)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Broadcast))
            .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
            .slice(0, limitCount);
    }
};
