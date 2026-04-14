import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { socialNotificationPolicyService } from './SocialNotificationPolicyService';

const MIGRATION_KEY_PREFIX = 'khalil_social_policy_migration_v1_';

class SocialNotificationMigrationService {
    private getMigrationKey(userId: string): string {
        return `${MIGRATION_KEY_PREFIX}${userId}`;
    }

    isMigrated(userId: string): boolean {
        return localStorage.getItem(this.getMigrationKey(userId)) === 'done';
    }

    markMigrated(userId: string): void {
        localStorage.setItem(this.getMigrationKey(userId), 'done');
    }

    async migrateLegacyNotifications(userId: string): Promise<void> {
        if (this.isMigrated(userId)) return;

        const notificationsRef = collection(db, 'notifications');
        const queries = [
            query(notificationsRef, where('toUserId', '==', userId), where('type', '==', 'adhan_reminder')),
            query(notificationsRef, where('toUserId', '==', userId), where('type', '==', 'reminder')),
            query(notificationsRef, where('toUserId', '==', userId), where('type', '==', 'broadcast')),
        ];

        const snapshots = await Promise.all(queries.map((q) => getDocs(q)));
        for (const snap of snapshots) {
            for (const d of snap.docs) {
                const n = d.data() as any;
                if (n.type === 'adhan_reminder' && n.prayerName) {
                    await socialNotificationPolicyService.createPrayerReminderPolicy(
                        userId,
                        n.toGroupId ? 'suhba' : 'partner',
                        { type: 'user', userIds: [userId] },
                        String(n.prayerName).toLowerCase() as any,
                        n.message || `Time for ${n.prayerName} prayer`
                    );
                } else if (n.type === 'reminder' || n.type === 'broadcast') {
                    await socialNotificationPolicyService.createOneTimePolicy(
                        userId,
                        n.toGroupId ? 'suhba' : 'partner',
                        { type: 'user', userIds: [userId] },
                        n.type === 'broadcast' ? 'Circle Reminder' : 'Reminder',
                        n.message || 'You have a reminder',
                        new Date(Date.now() + 60 * 1000)
                    );
                }
            }
        }

        this.markMigrated(userId);
    }
}

export const socialNotificationMigrationService = new SocialNotificationMigrationService();
