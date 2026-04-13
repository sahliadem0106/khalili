import { Timestamp } from 'firebase/firestore';

// Legacy type - kept for backwards compatibility
export type PartnerLevel = 'beginner' | 'intermediate' | 'hafiz';
export type RecruitmentStatus = 'open' | 'closed';
export type ChallengeStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface PartnerProfile {
    userId: string;
    isPublic: boolean;
    nickname: string; // Privacy-focused name
    age: number;
    gender: 'male' | 'female';
    location: {
        city: string;
        country: string;
        latitude?: number;
        longitude?: number;
    };
    hobbies: string[]; // Tags like "swimming", "football", "reading"
    bio: string;
    socialLinks?: Array<{
        platform: string; // e.g., "WhatsApp", "Instagram", "Telegram"
        handle: string;   // Username, phone, or link
    }>;
    qrCodeId?: string; // Unique ID for QR code connections
    lastActive: Timestamp;
}

export type PartnershipStatus = 'active' | 'pending' | 'blocked';
export type RequestType = 'duo' | 'family' | 'suhba' | 'social_share';

export interface PartnerRequest {
    id: string; // Document ID
    fromUserId: string;
    toUserId: string;
    type: RequestType;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: Timestamp;
    details?: {
        groupId?: string;
        groupName?: string;
        message?: string; // For custom messages
    };
    fromUserData?: PartnerProfile; // Hydrated for UI
}

export interface Partnership {
    id: string;
    users: [string, string]; // [userId1, userId2]
    status: PartnershipStatus;
    startDate: Timestamp;
    stats: {
        [userId: string]: {
            currentStreak: number;
            lastPrayed: string; // e.g., "Fajr"
            totalPrayersLogged: number;
        };
    };
    socialShareStatus?: {
        requestedBy?: string;
        requestedAt?: Timestamp;
        acceptedBy?: string[];
    };
}

// Social share request (after 3 days of partnership)
export interface SocialShareRequest {
    id: string;
    partnershipId: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'dismissed';
    timestamp: Timestamp;
    message?: string;
}

// Notification for reminders, broadcasts, invites
export interface PartnerNotification {
    id: string;
    type: 'reminder' | 'social_share' | 'invite' | 'broadcast' | 'adhan_reminder' | 'partner_request';
    fromUserId: string;
    toUserId?: string;
    toGroupId?: string;
    message: string;
    actionType?: 'pray' | 'adhkar' | 'dhikr' | 'custom';
    targetId?: string; // Dhikr/Adhkar ID for redirect
    timestamp: Timestamp;
    read: boolean;
    delivered: boolean;       // True when notification reached user's device
    deliveredAt?: Timestamp;  // When it was delivered
}

export type FamilyRole = 'admin' | 'parent' | 'child';

export interface FamilyMember {
    userId: string;
    role: FamilyRole;
    joinedAt: Timestamp;
}

export interface GroupBase {
    id: string;
    adminId: string; // The creator/owner
    coAdmins?: string[]; // Additional admins (e.g., wife can manage)
    name: string;
    description?: string;
    createdAt: Timestamp;
    members: string[]; // Keep for simple querying
    memberDetails?: Record<string, FamilyMember>; // Detailed role info
    type: 'family' | 'suhba';
    isPaid?: boolean; // Payment status for premium features
    inviteCode?: string; // Shareable invite code
}

export interface FamilyGroup extends GroupBase {
    type: 'family';
    plan: 'basic' | 'premium';
}

export interface SuhbaCircle extends GroupBase {
    type: 'suhba';
    isPublic: boolean;
    category?: string;
}

export interface Challenge {
    id: string;
    groupId: string;
    createdBy: string;
    title: string;
    description: string;
    deadline: Timestamp;
    reward?: string;

    // Assignment Logic
    assignedToType: 'all' | 'role' | 'specific';
    assignedTo: string[]; // If role: ['child'], if specific: [userIds]

    participantsStatus: {
        [userId: string]: ChallengeStatus;
    };
    proofs: {
        [userId: string]: {
            note?: string;
            submittedAt: Timestamp;
        };
    };
}
