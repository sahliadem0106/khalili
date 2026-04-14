import { Timestamp } from 'firebase/firestore';

export type RequestType = 'duo' | 'family' | 'suhba';
export type PartnerRole = 'creator' | 'admin' | 'member';
export type ShareLevel = 'minimal' | 'standard' | 'full';

export interface PartnerProfile {
    userId: string;
    qrCodeId: string;
    lastActive: Timestamp;
    nickname: string;
    isPublic: boolean;
    gender: 'male' | 'female';
    age: number;
    location: {
        country: string;
        city: string;
        latitude?: number;
        longitude?: number;
    };
    hobbies?: string[];
    bio?: string;
    socialLinks?: Array<{ platform: string, handle: string }>;
}

export interface Partnership {
    id: string;
    users: string[];
    status: 'active' | 'ended';
    startDate: Timestamp;
    endedBy?: string;
    endedAt?: Timestamp;
    stats: Record<string, {
        currentStreak: number;
        lastPrayed: string;
        totalPrayersLogged: number;
    }>;
    socialShareStatus?: {
        requestedBy?: string;
        requestedAt?: Timestamp;
        acceptedBy?: string[];
    };
}

export interface PartnerRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    type: RequestType;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: Timestamp;
    details?: any;
    fromUserData?: PartnerProfile;
}

export interface SocialShareRequest {
    id: string;
    partnershipId: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'dismissed';
    message: string;
    timestamp: Timestamp;
}

export interface PartnerNotification {
    id: string;
    type: 'reminder' | 'partner_request' | 'adhan_reminder' | string;
    fromUserId: string;
    toUserId: string;
    message: string;
    timestamp: Timestamp;
    read: boolean;
    delivered: boolean;
    partnershipId?: string;
    requestId?: string;
    requestType?: RequestType;
    prayerName?: string;
}

export interface SuhbaCircle {
    id: string;
    name: string;
    description: string;
    adminId: string;
    members: string[];
    createdAt: Timestamp;
    inviteCode: string;
}

export type FamilyRole = 'admin' | 'parent' | 'child';

export interface FamilyMember {
    userId: string;
    role: FamilyRole;
    joinedAt: Timestamp;
}

export interface FamilyGroup {
    id: string;
    adminId: string;
    coAdmins: string[];
    name: string;
    createdAt: Timestamp;
    members: string[];
    memberDetails: Record<string, FamilyMember>;
    type: 'family';
    plan: 'premium' | 'basic';
    isPaid: boolean;
    inviteCode: string;
}

export interface Challenge {
    id: string;
    groupId: string;
    title: string;
    description: string;
    reward: string;
    deadline: Timestamp;
    assignedToType: 'all' | 'role' | 'specific';
    assignedTo: string[];
    createdBy: string;
    createdAt: Timestamp;
    participantsStatus: Record<string, 'pending' | 'submitted' | 'approved'>;
    proofs: Record<string, { note: string; submittedAt: Timestamp }>;
}
