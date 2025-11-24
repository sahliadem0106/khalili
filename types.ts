
import type { ElementType } from 'react';

// TYPES
export type Language = 'en' | 'ar';

export type BarrierType = 'sleep' | 'work' | 'forgetfulness' | 'travel' | 'procrastination' | 'none';
export type HeartCondition = 'grateful' | 'anxious' | 'distracted' | 'peaceful' | 'sad' | 'neutral';

// --- THEME TYPES ---
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'forest' | 'blue' | 'rose' | 'violet' | 'amber';

export interface ThemeConfig {
  mode: ThemeMode;
  color: ThemeColor;
}

// --- PRAYER SETTINGS TYPES ---
export type Madhab = 'Standard' | 'Hanafi';
export type CalculationMethod = 'MuslimWorldLeague' | 'Egyptian' | 'Karachi' | 'UmmAlQura' | 'Dubai' | 'MoonsightingCommittee' | 'NorthAmerica' | 'Kuwait' | 'Qatar' | 'Singapore' | 'Turkey' | 'Tehran' | 'Other';

export interface PrayerOffsets {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerSettings {
  method: CalculationMethod;
  madhab: Madhab;
  offsets: PrayerOffsets;
}

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

export type ActionId = 'quran' | 'qibla' | 'dua' | 'tasbih' | 'zakat' | 'qada' | 'reminder' | 'settings' | 'lectures' | 'goals' | 'partners' | 'habits';

export interface NavItem {
  id: string;
  label: string;
  icon: ElementType;
}

export interface QuickAction {
  id: ActionId;
  label: string;
  icon: ElementType;
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

export interface Dua {
  category: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
}

// --- QURAN TYPES ---

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  audio?: string;
  text: string;
  translation: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surah: number;             
  surahName: string;          
  surahNameArabic: string;    
}

export interface QuranPage {
  pageNumber: number;
  ayahs: Ayah[];
  surahName?: string; // The surah starting or continuing on this page
  juzNumber?: number;
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

// --- HABIT ENGINE TYPES ---

export type HabitType = 'build' | 'quit';

export interface HabitLog {
  date: string; // ISO date string
  completed: boolean;
  reflection?: string;
  aiAdvice?: string; // Cached advice
}

export interface Habit {
  id: string;
  title: string;
  type: HabitType;
  niyyah: string; // The spiritual intention behind the habit
  startDate: string;
  streak: number;
  totalDays: number;
  logs: HabitLog[];
  reminderTime?: string;
}

// --- MURSHID CHAT TYPES ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// CONSTANTS AS ENUMS (Safer for Runtime)
export const PrayerStatus = {
  Upcoming: 'upcoming',
  Jamaah: 'jamaah',
  Home: 'home',
  Late: 'late',
  Missed: 'missed',
  QadaDone: 'qada_done',
} as const;

export type PrayerStatus = typeof PrayerStatus[keyof typeof PrayerStatus];