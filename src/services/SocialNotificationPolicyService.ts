import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    increment,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from './firebase';
import { SocialNotificationPolicy, SocialScope } from '../types/socialNotificationPolicy';
import { PartnerService } from './PartnerService';
import { FamilyService } from './FamilyService';
import { SuhbaService } from './SuhbaService';

const COLLECTION = 'socialNotificationPolicies';

class SocialNotificationPolicyService {
    async createPolicy(input: Omit<SocialNotificationPolicy, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<string> {
        const ref = await addDoc(collection(db, COLLECTION), {
            ...input,
            enabled: input.enabled !== false,
            version: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return ref.id;
    }

    async updatePolicy(policyId: string, updates: Partial<SocialNotificationPolicy>): Promise<void> {
        const ref = doc(db, COLLECTION, policyId);
        await updateDoc(ref, {
            ...updates,
            version: increment(1),
            updatedAt: serverTimestamp(),
        });
    }

    async fetchPoliciesForUser(userId: string): Promise<SocialNotificationPolicy[]> {
        const policiesRef = collection(db, COLLECTION);
        const directPoliciesQ = query(
            policiesRef,
            where('enabled', '==', true),
            where('audience.type', '==', 'user'),
            where('audience.userIds', 'array-contains', userId)
        );

        const [partnership, families, circles] = await Promise.all([
            PartnerService.getActivePartnership(userId),
            FamilyService.getMyFamilies(userId),
            SuhbaService.getMyCircles(userId),
        ]);

        const groupIds = new Set<string>([
            ...families.map((f) => f.id),
            ...circles.map((c) => c.id),
        ]);

        const tasks: Promise<any>[] = [getDocs(directPoliciesQ)];

        if (partnership?.id) {
            const partnerPoliciesQ = query(
                policiesRef,
                where('enabled', '==', true),
                where('audience.type', '==', 'partnership'),
                where('audience.partnershipId', '==', partnership.id)
            );
            tasks.push(getDocs(partnerPoliciesQ));
        }

        for (const groupId of groupIds) {
            const groupPoliciesQ = query(
                policiesRef,
                where('enabled', '==', true),
                where('audience.type', '==', 'group'),
                where('audience.groupId', '==', groupId)
            );
            tasks.push(getDocs(groupPoliciesQ));
        }

        const snapshots = await Promise.all(tasks);
        const merged = new Map<string, SocialNotificationPolicy>();
        snapshots.forEach((snap) => {
            snap.docs.forEach((d: any) => {
                merged.set(d.id, { id: d.id, ...d.data() } as SocialNotificationPolicy);
            });
        });

        return Array.from(merged.values());
    }

    async createPrayerReminderPolicy(
        ownerId: string,
        scope: SocialScope,
        audience: SocialNotificationPolicy['audience'],
        prayerName: SocialNotificationPolicy['prayerName'],
        message: string
    ): Promise<string> {
        return this.createPolicy({
            scope,
            ownerId,
            audience,
            ruleType: 'prayerLinked',
            prayerName,
            title: `${prayerName?.toUpperCase()} Reminder`,
            message,
            enabled: true,
        });
    }

    async createOneTimePolicy(
        ownerId: string,
        scope: SocialScope,
        audience: SocialNotificationPolicy['audience'],
        title: string,
        message: string,
        oneTimeAt: Date
    ): Promise<string> {
        return this.createPolicy({
            scope,
            ownerId,
            audience,
            ruleType: 'oneTime',
            title,
            message,
            oneTimeAt: oneTimeAt.toISOString(),
            enabled: true,
        });
    }

    async fetchOwnedPolicies(ownerId: string): Promise<SocialNotificationPolicy[]> {
        const q = query(
            collection(db, COLLECTION),
            where('ownerId', '==', ownerId),
            orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SocialNotificationPolicy));
    }

    async deletePolicy(policyId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION, policyId));
    }
}

export const socialNotificationPolicyService = new SocialNotificationPolicyService();
