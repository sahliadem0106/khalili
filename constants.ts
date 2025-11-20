import { Prayer, PrayerStatus, User, QadaStats, PrayerPartner, RakibGroup } from './types';

// Image Assets (High quality Unsplash IDs)
export const IMAGES = {
  mosqueHero: "https://images.unsplash.com/photo-1543736966-c7df23988732?q=80&w=800&auto=format&fit=crop", // Beautiful mosque interior detail
  mosqueCard: "https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=600&auto=format&fit=crop", // Sheikh Zayed
  pattern: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop", // Geometric
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  avatar2: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
  avatar3: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
  avatar4: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
};

export const MOCK_USER: User = {
  name: "Ali",
  location: "Sampang, Indonesia",
  hijriDate: "9 Dhu al-Hijjah, 1445 AH",
  avatar: IMAGES.avatar,
};

export const INITIAL_PRAYERS: Prayer[] = [
  { id: "fajr", name: "Fajr", arabicName: "الفجر", time: "04:27", status: PrayerStatus.Missed },
  { id: "dhuhr", name: "Dhuhr", arabicName: "الظهر", time: "12:41", status: PrayerStatus.Jamaah },
  { id: "asr", name: "Asr", arabicName: "العصر", time: "15:13", status: PrayerStatus.Home },
  { id: "maghrib", name: "Maghrib", arabicName: "المغرب", time: "18:05", status: PrayerStatus.Late },
  { id: "isha", name: "Isha", arabicName: "العشاء", time: "19:30", status: PrayerStatus.QadaDone, isNext: true },
];

export const MOCK_QADA: QadaStats = {
  totalMissed: 3,
  madeUp: 1,
};

export const WEEKLY_STATS_DATA = [
  { day: 'Mon', completion: 80 },
  { day: 'Tue', completion: 60 },
  { day: 'Wed', completion: 90 },
  { day: 'Thu', completion: 50 },
  { day: 'Fri', completion: 75 },
  { day: 'Sat', completion: 33 },
  { day: 'Sun', completion: 100 },
];

export const STATUS_COLORS = {
  [PrayerStatus.Jamaah]: 'bg-status-jamaah text-white',
  [PrayerStatus.Home]: 'bg-status-home text-neutral-primary',
  [PrayerStatus.Late]: 'bg-status-late text-white',
  [PrayerStatus.Missed]: 'bg-status-missed text-white',
  [PrayerStatus.QadaDone]: 'bg-status-qada text-white',
  [PrayerStatus.Upcoming]: 'bg-neutral-100 text-neutral-500',
};

export const STATUS_LABELS = {
  [PrayerStatus.Jamaah]: 'Jamaah',
  [PrayerStatus.Home]: 'Home',
  [PrayerStatus.Late]: 'Late',
  [PrayerStatus.Missed]: 'Missed',
  [PrayerStatus.QadaDone]: 'Made Up',
  [PrayerStatus.Upcoming]: 'Upcoming',
};

// --- MOCK RAKIB DATA ---

export const MOCK_PARTNERS: PrayerPartner[] = [
  {
    id: "p1",
    name: "Ahmed Rahim",
    avatar: IMAGES.avatar2,
    shareLevel: "standard",
    myShareLevel: "full",
    today: {
      fajr: PrayerStatus.Late,
      dhuhr: PrayerStatus.Jamaah,
      asr: PrayerStatus.Jamaah,
      maghrib: PrayerStatus.Upcoming,
      isha: PrayerStatus.Upcoming,
    },
    streak: 6,
    onTimeRate: 0.86,
    heartState: 78,
    badges: ["week_warrior"],
    canRemind: true,
  },
  {
    id: "p2",
    name: "Yusuf",
    avatar: IMAGES.avatar,
    shareLevel: "minimal",
    myShareLevel: "minimal",
    today: {
      fajr: PrayerStatus.Home,
      dhuhr: PrayerStatus.Home,
      asr: PrayerStatus.Missed,
      maghrib: PrayerStatus.Upcoming,
      isha: PrayerStatus.Upcoming,
    },
    streak: 0,
    canRemind: true,
  }
];

export const MOCK_GROUPS: RakibGroup[] = [
  {
    id: "g1",
    name: "Family Al-Faruq",
    consistency: 82,
    streak: 14,
    currentUserRole: "admin",
    members: [
      { id: "m1", name: "Ali (You)", role: "admin", todayCompleted: 3, streak: 12, isMe: true, avatar: IMAGES.avatar },
      { id: "m2", name: "Father", role: "creator", todayCompleted: 3, streak: 120, avatar: IMAGES.avatar2 },
      { id: "m3", name: "Sarah", role: "member", todayCompleted: 2, streak: 4, avatar: IMAGES.avatar3 },
      { id: "m4", name: "Omar", role: "member", todayCompleted: 1, streak: 0, avatar: IMAGES.avatar4 },
    ]
  }
];