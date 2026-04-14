import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { authService } from './AuthService';
import { BillingPlan, DEFAULT_BILLING_PLAN, LimitFeatureKey, PLAN_LIMITS } from '../config/planLimits';

interface DailyUsageDoc {
    plan: BillingPlan;
    counts: Partial<Record<LimitFeatureKey, number>>;
    updatedAt?: unknown;
}

interface ConsumeResult {
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
}

class PlanLimitService {
    private getDayKey(date: Date = new Date()): string {
        return date.toISOString().split('T')[0];
    }

    private async resolveUserPlan(userId: string): Promise<BillingPlan> {
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser?.uid === userId) {
                // Existing model currently stores premium as boolean.
                // Map premium users to plus by default.
                return currentUser.premium ? 'plus' : 'free';
            }

            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) return DEFAULT_BILLING_PLAN;
            const data = userDoc.data() as any;

            if (data.plan === 'plus' || data.plan === 'family' || data.plan === 'free') {
                return data.plan as BillingPlan;
            }

            return data.premium ? 'plus' : 'free';
        } catch {
            return DEFAULT_BILLING_PLAN;
        }
    }

    async consume(userId: string, feature: LimitFeatureKey, amount: number = 1): Promise<ConsumeResult> {
        const dayKey = this.getDayKey();
        const usageRef = doc(db, 'users', userId, 'usageDaily', dayKey);
        const plan = await this.resolveUserPlan(userId);
        const limit = PLAN_LIMITS[plan][feature];

        const result = await runTransaction(db, async (tx) => {
            const snap = await tx.get(usageRef);
            const data = (snap.exists() ? snap.data() : null) as DailyUsageDoc | null;
            const counts = data?.counts || {};
            const used = counts[feature] || 0;
            const next = used + amount;

            if (next > limit) {
                return {
                    allowed: false,
                    used,
                    limit,
                    remaining: Math.max(0, limit - used),
                };
            }

            tx.set(
                usageRef,
                {
                    plan,
                    counts: {
                        ...counts,
                        [feature]: next,
                    },
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );

            return {
                allowed: true,
                used: next,
                limit,
                remaining: Math.max(0, limit - next),
            };
        });

        return result;
    }
}

export const planLimitService = new PlanLimitService();
