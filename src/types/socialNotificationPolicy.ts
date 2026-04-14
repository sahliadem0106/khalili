import { Timestamp } from 'firebase/firestore';

export type SocialScope = 'partner' | 'family' | 'suhba';
export type SocialRuleType = 'hourly' | 'dailyTime' | 'prayerLinked' | 'oneTime';
export type SocialAudienceType = 'user' | 'group' | 'partnership';
export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface SocialNotificationAudience {
    type: SocialAudienceType;
    userIds?: string[];
    groupId?: string;
    partnershipId?: string;
}

export interface SocialNotificationPolicy {
    id: string;
    scope: SocialScope;
    ownerId: string;
    audience: SocialNotificationAudience;
    ruleType: SocialRuleType;
    title: string;
    message: string;
    enabled: boolean;
    timezone?: string;
    startAt?: Timestamp | string;
    endAt?: Timestamp | string;
    oneTimeAt?: Timestamp | string;
    dailyTime?: string; // HH:mm
    hourlyIntervalMinutes?: number;
    prayerName?: PrayerName;
    createdAt?: Timestamp | string;
    updatedAt?: Timestamp | string;
    version: number;
}

export interface SocialNotificationDeliverySettings {
    mutedScopes: SocialScope[];
    quietHoursEnabled: boolean;
    quietHoursStart: string; // HH:mm
    quietHoursEnd: string; // HH:mm
    socialRuleSyncEnabled: boolean;
}

export const DEFAULT_SOCIAL_NOTIFICATION_DELIVERY_SETTINGS: SocialNotificationDeliverySettings = {
    mutedScopes: [],
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    socialRuleSyncEnabled: true,
};
