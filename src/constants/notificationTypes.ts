export const CRITICAL_LIVE_NOTIFICATION_TYPES = [
    'partner_request',
    'invite',
    'request_accepted',
    'request_rejected',
] as const;

export type CriticalLiveNotificationType = (typeof CRITICAL_LIVE_NOTIFICATION_TYPES)[number];

export const LOCAL_SOCIAL_NOTIFICATION_TYPES = [
    'adhan_reminder',
    'reminder',
    'broadcast',
] as const;

export type LocalSocialNotificationType = (typeof LOCAL_SOCIAL_NOTIFICATION_TYPES)[number];

export const ALL_NOTIFICATION_TYPES = [
    ...CRITICAL_LIVE_NOTIFICATION_TYPES,
    ...LOCAL_SOCIAL_NOTIFICATION_TYPES,
] as const;

export type AppNotificationType = (typeof ALL_NOTIFICATION_TYPES)[number];
