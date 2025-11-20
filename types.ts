import React from 'react';

export enum PrayerStatus {
  Upcoming = 'upcoming',
  Jamaah = 'jamaah',
  Home = 'home',
  Late = 'late',
  Missed = 'missed',
  QadaDone = 'qada_done',
}

export type BarrierType = 'sleep' | 'work' | 'forgetfulness' | 'travel' | 'procrastination' | 'none';
export type HeartCondition = 'grateful' | 'anxious' | 'distracted' | 'peaceful' | 'sad' | 'neutral';

export interface Prayer {
  id: string;
  name: string;
  arabicName: string;
  time: string;
  status: PrayerStatus;
  isNext?: boolean;
  journalEntry?: string;
  khushuRating?: number; // 1-5 scale
  barrier?: BarrierType;
}

export interface User {
  name: string;
  location: string;
  hijriDate: string;
  avatar: string;
  currentHeartState?: HeartCondition;
}

export interface QadaStats {
  totalMissed: number;
  madeUp: number;
}

export type ActionId = 'quran' | 'qibla' | 'dua' | 'tasbih' | 'zakat' | 'qada' | 'reminder' | 'settings' | 'lectures' | 'goals' | 'partners';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export interface QuickAction {
  id: ActionId;
  label: string;
  icon: React.ElementType;
  color: string;
}

export interface TasbihState {
  count: number;
  target: number; // 0 for infinity
}

export type TasbihMode = 'single' | 'combo';

export interface DhikrPreset {
  label: string;
  arabic: string;
  defaultTarget?: number;
}

export interface Lecture {
  id: string;
  title: string;
  author: string;
  duration: string;
  image: string;
  category: 'Quran' | 'Fiqh' | 'History' | 'General';
}

// --- RAKIB SYSTEM TYPES ---

export type ShareLevel = 'minimal' | 'standard' | 'full';
export type PartnerRole = 'creator' | 'admin' | 'member';

export interface PrayerPartner {
  id: string;
  name: string;
  avatar: string;
  shareLevel: ShareLevel; // What they share with me
  myShareLevel: ShareLevel; // What I share with them
  today: Record<string, PrayerStatus>; // prayerId -> status
  streak: number;
  onTimeRate?: number; // 0-1
  heartState?: number; // 0-100, if allowed
  badges?: string[];
  canRemind: boolean;
  lastReminded?: Date;
}

export interface RakibMember {
  id: string;
  name: string;
  avatar: string;
  role: PartnerRole;
  todayCompleted: number;
  streak: number;
  isMe?: boolean;
}

export interface RakibGroup {
  id: string;
  name: string;
  members: RakibMember[];
  consistency: number; // percentage
  streak: number;
  currentUserRole: PartnerRole;
}