
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';

export type InviteType = 'family' | 'suhba' | 'duo';

export interface Invite {
    id: string;
    code: string;
    type: InviteType;
    groupId?: string;
    groupName?: string;
    inviterId: string;
    inviterName?: string;
    createdAt: Timestamp;
    expiresAt?: Timestamp;
    maxUses?: number;
    useCount: number;
    isActive: boolean;
}

export interface PendingInvite {
    type: InviteType;
    code: string;
    inviterId?: string;
    groupName?: string;
    timestamp: number;
}

const PENDING_INVITE_KEY = 'khalil_pending_invite';

// Helper to generate unique invite code
const generateInviteCode = (type: InviteType): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const prefix = type === 'family' ? 'FAM' : type === 'suhba' ? 'SUH' : 'DUO';
    let code = prefix + '-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const InviteService = {
    // --- Invite Creation ---

    async createInvite(
        type: InviteType,
        inviterId: string,
        inviterName: string,
        options?: {
            groupId?: string;
            groupName?: string;
            expiresInDays?: number;
            maxUses?: number;
        }
    ): Promise<Invite> {
        const code = generateInviteCode(type);

        const inviteData: any = {
            code,
            type,
            inviterId,
            inviterName,
            createdAt: Timestamp.now(),
            useCount: 0,
            isActive: true
        };

        if (options?.groupId) inviteData.groupId = options.groupId;
        if (options?.groupName) inviteData.groupName = options.groupName;
        if (options?.maxUses) inviteData.maxUses = options.maxUses;
        if (options?.expiresInDays) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + options.expiresInDays);
            inviteData.expiresAt = Timestamp.fromDate(expiresAt);
        }

        const docRef = await addDoc(collection(db, 'invites'), inviteData);
        return { id: docRef.id, ...inviteData } as Invite;
    },

    // --- Invite Retrieval (Public - no auth required for landing page) ---

    async getInviteByCode(code: string): Promise<Invite | null> {
        const q = query(
            collection(db, 'invites'),
            where('code', '==', code.toUpperCase()),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const invite = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Invite;

        // Check if expired
        if (invite.expiresAt && invite.expiresAt.toDate() < new Date()) {
            return null;
        }

        // Check if max uses reached
        if (invite.maxUses && invite.useCount >= invite.maxUses) {
            return null;
        }

        return invite;
    },

    async getInviteDetails(code: string): Promise<{
        valid: boolean;
        type?: InviteType;
        groupName?: string;
        inviterName?: string;
        message?: string;
    }> {
        const invite = await this.getInviteByCode(code);

        if (!invite) {
            return { valid: false, message: 'This invite link is invalid or has expired.' };
        }

        return {
            valid: true,
            type: invite.type,
            groupName: invite.groupName,
            inviterName: invite.inviterName
        };
    },

    // --- Invite Usage ---

    async useInvite(code: string, userId: string): Promise<{
        success: boolean;
        type?: InviteType;
        groupId?: string;
        message?: string;
    }> {
        const invite = await this.getInviteByCode(code);

        if (!invite) {
            return { success: false, message: 'This invite link is invalid or has expired.' };
        }

        // Increment use count
        const inviteRef = doc(db, 'invites', invite.id);
        await updateDoc(inviteRef, {
            useCount: invite.useCount + 1
        });

        return {
            success: true,
            type: invite.type,
            groupId: invite.groupId
        };
    },

    // --- Deactivate Invite ---

    async deactivateInvite(inviteId: string): Promise<void> {
        const inviteRef = doc(db, 'invites', inviteId);
        await updateDoc(inviteRef, { isActive: false });
    },

    // --- Get My Invites ---

    async getMyInvites(userId: string): Promise<Invite[]> {
        const q = query(
            collection(db, 'invites'),
            where('inviterId', '==', userId),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Invite));
    },

    // --- Pending Invite (localStorage for deferred deep linking) ---

    savePendingInvite(invite: PendingInvite): void {
        localStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite));
    },

    getPendingInvite(): PendingInvite | null {
        const stored = localStorage.getItem(PENDING_INVITE_KEY);
        if (!stored) return null;

        try {
            const invite = JSON.parse(stored) as PendingInvite;
            // Check if invite is older than 7 days
            if (Date.now() - invite.timestamp > 7 * 24 * 60 * 60 * 1000) {
                this.clearPendingInvite();
                return null;
            }
            return invite;
        } catch {
            return null;
        }
    },

    clearPendingInvite(): void {
        localStorage.removeItem(PENDING_INVITE_KEY);
    },

    // --- Generate Shareable Link ---

    generateShareLink(type: InviteType, code: string): string {
        // Use production URL for sharing (Firebase Hosting)
        const isProduction = !window.location.hostname.includes('localhost');
        const baseUrl = isProduction
            ? 'https://khalili-v01.web.app'
            : window.location.origin;
        return `${baseUrl}/join/${type}/${code}`;
    }
};
