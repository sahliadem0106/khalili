
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    query,
    where,
    getDocs,
    Timestamp,
    arrayUnion,
    arrayRemove,
    getDoc,
    deleteField
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { FamilyGroup, Challenge, FamilyRole, FamilyMember } from '../types/partner';

// Helper to generate random invite code
const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
    let result = 'FAM-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const FamilyService = {
    // --- Family Creation (with payment check) ---

    async createFamily(adminId: string, name: string, isPaid: boolean = false): Promise<string> {
        // In production, isPaid would be verified server-side via payment provider webhook
        // For now, we trust the client (mock payment gate)

        const inviteCode = generateInviteCode();

        const docRef = await addDoc(collection(db, 'groups'), {
            adminId,
            coAdmins: [], // Empty initially, can add wife later
            name,
            createdAt: Timestamp.now(),
            members: [adminId],
            memberDetails: {
                [adminId]: {
                    userId: adminId,
                    role: 'admin',
                    joinedAt: Timestamp.now()
                }
            },
            type: 'family',
            plan: isPaid ? 'premium' : 'basic',
            isPaid,
            inviteCode
        });
        return docRef.id;
    },

    async getFamily(familyId: string): Promise<FamilyGroup | null> {
        const ref = doc(db, 'groups', familyId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as FamilyGroup;
    },

    async getMyFamilies(userId: string): Promise<FamilyGroup[]> {
        const q = query(
            collection(db, 'groups'),
            where('members', 'array-contains', userId),
            where('type', '==', 'family')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FamilyGroup));
    },

    // --- Co-Admin Management (for allowing wife to manage) ---

    async addCoAdmin(familyId: string, requestingUserId: string, newCoAdminId: string): Promise<void> {
        const family = await this.getFamily(familyId);
        if (!family) throw new Error("Family not found");

        // Only admin can add co-admins
        if (family.adminId !== requestingUserId) {
            throw new Error("Only the family admin can add co-admins");
        }

        // Check if user is already a member
        if (!family.members.includes(newCoAdminId)) {
            throw new Error("User must be a family member first");
        }

        const ref = doc(db, 'groups', familyId);
        await updateDoc(ref, {
            coAdmins: arrayUnion(newCoAdminId),
            [`memberDetails.${newCoAdminId}.role`]: 'admin'
        });
    },

    async removeCoAdmin(familyId: string, requestingUserId: string, coAdminId: string): Promise<void> {
        const family = await this.getFamily(familyId);
        if (!family) throw new Error("Family not found");

        // Only main admin can remove co-admins
        if (family.adminId !== requestingUserId) {
            throw new Error("Only the family admin can remove co-admins");
        }

        const ref = doc(db, 'groups', familyId);
        await updateDoc(ref, {
            coAdmins: arrayRemove(coAdminId),
            [`memberDetails.${coAdminId}.role`]: 'parent' // Demote to parent
        });
    },

    isAdmin(family: FamilyGroup, userId: string): boolean {
        return family.adminId === userId || (family.coAdmins?.includes(userId) ?? false);
    },

    // --- Invite System ---

    async getInviteCode(familyId: string): Promise<string | null> {
        const family = await this.getFamily(familyId);
        return family?.inviteCode || null;
    },

    async regenerateInviteCode(familyId: string, requestingUserId: string): Promise<string> {
        const family = await this.getFamily(familyId);
        if (!family) throw new Error("Family not found");

        if (!this.isAdmin(family, requestingUserId)) {
            throw new Error("Only admins can regenerate invite codes");
        }

        const newCode = generateInviteCode();
        const ref = doc(db, 'groups', familyId);
        await updateDoc(ref, { inviteCode: newCode });
        return newCode;
    },

    async findFamilyByInviteCode(inviteCode: string): Promise<FamilyGroup | null> {
        const q = query(
            collection(db, 'groups'),
            where('inviteCode', '==', inviteCode.toUpperCase()),
            where('type', '==', 'family')
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FamilyGroup;
    },

    async joinViaInviteCode(inviteCode: string, userId: string): Promise<string> {
        const family = await this.findFamilyByInviteCode(inviteCode);
        if (!family) throw new Error("Invalid invite code");

        if (family.members.includes(userId)) {
            throw new Error("Already a member of this family");
        }

        await this.joinFamily(family.id, userId);
        return family.id;
    },

    // --- Member Management ---

    async joinFamily(familyId: string, userId: string): Promise<void> {
        const ref = doc(db, 'groups', familyId);
        const familyDoc = await getDoc(ref);
        if (!familyDoc.exists()) throw new Error("Family not found");

        await updateDoc(ref, {
            members: arrayUnion(userId),
            [`memberDetails.${userId}`]: {
                userId,
                role: 'child', // Default role for new members
                joinedAt: Timestamp.now()
            }
        });
    },

    async removeMember(familyId: string, requestingUserId: string, targetUserId: string): Promise<void> {
        const family = await this.getFamily(familyId);
        if (!family) throw new Error("Family not found");

        // Cannot remove the main admin
        if (targetUserId === family.adminId) {
            throw new Error("Cannot remove the family admin");
        }

        // Only admins can remove members
        if (!this.isAdmin(family, requestingUserId)) {
            throw new Error("Only admins can remove members");
        }

        const ref = doc(db, 'groups', familyId);
        await updateDoc(ref, {
            members: arrayRemove(targetUserId),
            coAdmins: arrayRemove(targetUserId),
            [`memberDetails.${targetUserId}`]: deleteField()
        });
    },

    async updateMemberRole(familyId: string, requestingUserId: string, targetUserId: string, newRole: FamilyRole): Promise<void> {
        const family = await this.getFamily(familyId);
        if (!family) throw new Error("Family not found");

        if (!this.isAdmin(family, requestingUserId)) {
            throw new Error("Only admins can update member roles");
        }

        const ref = doc(db, 'groups', familyId);
        await updateDoc(ref, {
            [`memberDetails.${targetUserId}.role`]: newRole
        });
    },

    // --- Challenges ---

    async createChallenge(challenge: Omit<Challenge, 'id' | 'participantsStatus' | 'proofs'>, requestingUserId: string) {
        // Verify admin rights
        const family = await this.getFamily(challenge.groupId);
        if (!family) throw new Error("Family not found");

        if (!this.isAdmin(family, requestingUserId)) {
            throw new Error("Only admins can create challenges");
        }

        let participants: string[] = [];

        if (challenge.assignedToType === 'specific') {
            participants = challenge.assignedTo;
        } else if (challenge.assignedToType === 'role') {
            const targetRole = challenge.assignedTo[0] as FamilyRole;
            participants = (Object.values(family.memberDetails || {}) as FamilyMember[])
                .filter(m => m.role === targetRole)
                .map(m => m.userId);
        } else {
            // 'all'
            participants = family.members;
        }

        const initialStatus: Record<string, any> = {};
        participants.forEach(uid => {
            initialStatus[uid] = 'pending';
        });

        const docRef = await addDoc(collection(db, 'challenges'), {
            ...challenge,
            createdBy: requestingUserId,
            createdAt: Timestamp.now(),
            participantsStatus: initialStatus,
            proofs: {}
        });

        return docRef.id;
    },

    async getActiveChallenges(groupId: string): Promise<Challenge[]> {
        const q = query(
            collection(db, 'challenges'),
            where('groupId', '==', groupId)
        );
        const snapshot = await getDocs(q);
        const now = new Date();

        return snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Challenge))
            .filter(c => c.deadline.toDate() > now);
    },

    async submitProof(challengeId: string, userId: string, note?: string) {
        const ref = doc(db, 'challenges', challengeId);
        await updateDoc(ref, {
            [`proofs.${userId}`]: {
                note: note || '',
                submittedAt: Timestamp.now()
            },
            [`participantsStatus.${userId}`]: 'submitted'
        });
    },

    async approveProof(challengeId: string, requestingUserId: string, targetUserId: string) {
        // Get challenge to find groupId
        const challengeRef = doc(db, 'challenges', challengeId);
        const challengeSnap = await getDoc(challengeRef);
        if (!challengeSnap.exists()) throw new Error("Challenge not found");

        const challenge = challengeSnap.data() as Challenge;
        const family = await this.getFamily(challenge.groupId);
        if (!family) throw new Error("Family not found");

        if (!this.isAdmin(family, requestingUserId)) {
            throw new Error("Only admins can approve proofs");
        }

        await updateDoc(challengeRef, {
            [`participantsStatus.${targetUserId}`]: 'approved'
        });
    }
};
