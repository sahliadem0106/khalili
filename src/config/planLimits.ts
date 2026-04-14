export type BillingPlan = 'free' | 'plus' | 'family';

export type LimitFeatureKey =
    | 'partner_requests_per_day'
    | 'suhba_broadcasts_per_day'
    | 'social_policies_created_per_day';

export interface PlanLimitConfig {
    partner_requests_per_day: number;
    suhba_broadcasts_per_day: number;
    social_policies_created_per_day: number;
}

/**
 * Keep thresholds high enough for normal users so UX remains smooth.
 * These are designed to block abuse/spam patterns rather than daily usage.
 */
export const PLAN_LIMITS: Record<BillingPlan, PlanLimitConfig> = {
    free: {
        partner_requests_per_day: 15,
        suhba_broadcasts_per_day: 30,
        social_policies_created_per_day: 40,
    },
    plus: {
        partner_requests_per_day: 60,
        suhba_broadcasts_per_day: 120,
        social_policies_created_per_day: 200,
    },
    family: {
        partner_requests_per_day: 120,
        suhba_broadcasts_per_day: 300,
        social_policies_created_per_day: 500,
    },
};

export const DEFAULT_BILLING_PLAN: BillingPlan = 'free';
