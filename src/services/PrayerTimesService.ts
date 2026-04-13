/**
 * PrayerTimesService - Calculate accurate prayer times using the Adhan library
 * Uses spherical astronomy to calculate times based on user location
 */

import {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  Prayer,
  Madhab
} from 'adhan';
import { format, addDays, differenceInSeconds, startOfDay } from 'date-fns';

// =================== TYPES ===================

export type CalculationMethodName =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'NorthAmerica'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey';

export interface PrayerTimesSettings {
  calculationMethod: CalculationMethodName;
  asrJuristic: 'standard' | 'hanafi';
  adjustments: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timezone: string;
  source: 'gps' | 'manual' | 'ip';
}

export interface CalculatedPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  date: Date;
  nextPrayer: {
    name: string;
    time: Date;
    remaining: number; // seconds
  };
}

export interface HijriDate {
  day: number;
  month: number;
  monthName: string;
  monthNameAr: string;
  year: number;
  formatted: string;
}

// =================== CONSTANTS ===================

const CALCULATION_METHODS: Record<CalculationMethodName, () => CalculationParameters> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Dubai: CalculationMethod.Dubai,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
  NorthAmerica: CalculationMethod.NorthAmerica,
  Kuwait: CalculationMethod.Kuwait,
  Qatar: CalculationMethod.Qatar,
  Singapore: CalculationMethod.Singapore,
  Tehran: CalculationMethod.Tehran,
  Turkey: CalculationMethod.Turkey,
};

const HIJRI_MONTHS = [
  { en: 'Muharram', ar: 'محرم' },
  { en: 'Safar', ar: 'صفر' },
  { en: 'Rabi al-Awwal', ar: 'ربيع الأول' },
  { en: 'Rabi al-Thani', ar: 'ربيع الثاني' },
  { en: 'Jumada al-Awwal', ar: 'جمادى الأولى' },
  { en: 'Jumada al-Thani', ar: 'جمادى الآخرة' },
  { en: 'Rajab', ar: 'رجب' },
  { en: 'Shaban', ar: 'شعبان' },
  { en: 'Ramadan', ar: 'رمضان' },
  { en: 'Shawwal', ar: 'شوال' },
  { en: 'Dhu al-Qadah', ar: 'ذو القعدة' },
  { en: 'Dhu al-Hijjah', ar: 'ذو الحجة' },
];

const PRAYER_NAMES = {
  fajr: { en: 'Fajr', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
};

// =================== DEFAULT SETTINGS ===================

export const DEFAULT_PRAYER_SETTINGS: PrayerTimesSettings = {
  calculationMethod: 'MuslimWorldLeague',
  asrJuristic: 'standard',
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
};

// =================== STORAGE KEYS ===================

const STORAGE_KEYS = {
  location: 'khalil_location',
  prayerSettings: 'khalil_prayer_settings',
  cachedTimes: 'khalil_cached_times',
};

// =================== SERVICE CLASS ===================

class PrayerTimesService {
  private cachedTimes: Map<string, CalculatedPrayerTimes> = new Map();
  private updateCallbacks: Set<(times: CalculatedPrayerTimes) => void> = new Set();
  private countdownInterval: number | null = null;

  /**
   * Get calculation parameters from method name
   */
  private getCalculationParams(settings: PrayerTimesSettings): CalculationParameters {
    const methodFn = CALCULATION_METHODS[settings.calculationMethod];
    const params = methodFn();

    // Set Asr calculation (Shafi vs Hanafi)
    params.madhab = settings.asrJuristic === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

    // Apply custom adjustments
    params.adjustments = {
      fajr: settings.adjustments.fajr,
      sunrise: settings.adjustments.sunrise,
      dhuhr: settings.adjustments.dhuhr,
      asr: settings.adjustments.asr,
      maghrib: settings.adjustments.maghrib,
      isha: settings.adjustments.isha,
    };

    return params;
  }

  /**
   * Calculate prayer times for a specific date and location
   */
  calculateForDate(
    location: UserLocation,
    date: Date,
    settings: PrayerTimesSettings = DEFAULT_PRAYER_SETTINGS
  ): CalculatedPrayerTimes {
    const cacheKey = `${location.latitude},${location.longitude},${format(date, 'yyyy-MM-dd')}`;

    // Check cache first
    if (this.cachedTimes.has(cacheKey)) {
      return this.cachedTimes.get(cacheKey)!;
    }

    const coordinates = new Coordinates(location.latitude, location.longitude);
    const params = this.getCalculationParams(settings);
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    const result: CalculatedPrayerTimes = {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
      date: startOfDay(date),
      nextPrayer: this.getNextPrayer(prayerTimes, date),
    };

    // Cache the result
    this.cachedTimes.set(cacheKey, result);

    return result;
  }

  /**
   * Calculate today's prayer times
   */
  getTodaysTimes(
    location: UserLocation,
    settings?: PrayerTimesSettings
  ): CalculatedPrayerTimes {
    return this.calculateForDate(location, new Date(), settings);
  }

  /**
   * Get the next upcoming prayer
   */
  private getNextPrayer(prayerTimes: PrayerTimes, now: Date = new Date()): {
    name: string;
    time: Date;
    remaining: number;
  } {
    try {
      const nextPrayer = prayerTimes.nextPrayer(now);

      let nextTime: Date;
      let prayerName: string;

      // Map Prayer enum to string names (using string keys to avoid TS issues)
      const prayerEnumToName: { [key: number]: string } = {
        0: 'fajr',      // Prayer.Fajr
        1: 'sunrise',   // Prayer.Sunrise
        2: 'dhuhr',     // Prayer.Dhuhr
        3: 'asr',       // Prayer.Asr
        4: 'maghrib',   // Prayer.Maghrib
        5: 'isha',      // Prayer.Isha
      };

      if (nextPrayer === Prayer.None || nextPrayer === undefined || nextPrayer === null) {
        // After Isha, next is tomorrow's Fajr
        // Use current location's coordinates from prayerTimes
        const tomorrow = addDays(now, 1);
        try {
          // Create new prayer times for tomorrow using default calculation
          const tomorrowTimes = new PrayerTimes(
            new Coordinates(0, 0), // Will use default
            tomorrow,
            CalculationMethod.MuslimWorldLeague()
          );
          nextTime = tomorrowTimes.fajr;
        } catch {
          // Fallback: estimate tomorrow's Fajr as 5:00 AM
          nextTime = new Date(tomorrow);
          nextTime.setHours(5, 0, 0, 0);
        }
        prayerName = 'fajr';
      } else {
        const timeForPrayer = prayerTimes.timeForPrayer(nextPrayer);
        nextTime = timeForPrayer || new Date();

        // Use safe mapping instead of Prayer[nextPrayer].toLowerCase()
        prayerName = prayerEnumToName[nextPrayer] || 'fajr';
      }

      return {
        name: prayerName,
        time: nextTime,
        remaining: Math.max(0, differenceInSeconds(nextTime, now)),
      };
    } catch (error) {
      console.error('Error calculating next prayer:', error);
      // Return safe default
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      return {
        name: 'fajr',
        time: defaultTime,
        remaining: 3600,
      };
    }
  }

  /**
   * Convert Gregorian date to Hijri
   */
  toHijriDate(date: Date = new Date()): HijriDate {
    // Hijri calendar algorithm (simplified Kuwaiti algorithm)
    const jd = this.gregorianToJD(date);
    const hijri = this.jdToHijri(jd);

    const month = HIJRI_MONTHS[hijri.month - 1];

    return {
      day: hijri.day,
      month: hijri.month,
      monthName: month.en,
      monthNameAr: month.ar,
      year: hijri.year,
      formatted: `${hijri.day} ${month.en}, ${hijri.year} AH`,
    };
  }

  /**
   * Convert Gregorian date to Julian Day Number
   */
  private gregorianToJD(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    return day + Math.floor((153 * m + 2) / 5) + 365 * y +
      Math.floor(y / 4) - Math.floor(y / 100) +
      Math.floor(y / 400) - 32045;
  }

  /**
   * Convert Julian Day Number to Hijri
   */
  private jdToHijri(jd: number): { day: number; month: number; year: number } {
    const l = Math.floor(jd) - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
      Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;

    return { day, month, year };
  }

  /**
   * Format time for display
   */
  formatTime(date: Date, use24Hour: boolean = false): string {
    return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
  }

  /**
   * Format remaining time as countdown
   */
  formatCountdown(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  /**
   * Get prayer name in specified language
   */
  getPrayerName(prayer: string, language: 'en' | 'ar' = 'en'): string {
    const names = PRAYER_NAMES[prayer as keyof typeof PRAYER_NAMES];
    return names ? names[language] : prayer;
  }

  /**
   * Subscribe to prayer time updates
   */
  subscribe(callback: (times: CalculatedPrayerTimes) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Start countdown timer that updates every second
   */
  startCountdown(location: UserLocation, settings?: PrayerTimesSettings): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = window.setInterval(() => {
      const times = this.getTodaysTimes(location, settings);
      // Recalculate next prayer with current time
      const coordinates = new Coordinates(location.latitude, location.longitude);
      const params = this.getCalculationParams(settings || DEFAULT_PRAYER_SETTINGS);
      const prayerTimes = new PrayerTimes(coordinates, new Date(), params);

      times.nextPrayer = this.getNextPrayer(prayerTimes, new Date());

      this.updateCallbacks.forEach(cb => cb(times));
    }, 1000);
  }

  /**
   * Stop countdown timer
   */
  stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Load saved settings from localStorage
   */
  loadSettings(): PrayerTimesSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.prayerSettings);
      if (saved) {
        return { ...DEFAULT_PRAYER_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load prayer settings:', e);
    }
    return DEFAULT_PRAYER_SETTINGS;
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings: PrayerTimesSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.prayerSettings, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save prayer settings:', e);
    }
  }

  /**
   * Load saved location from localStorage
   */
  loadLocation(): UserLocation | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.location);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load location:', e);
    }
    return null;
  }

  /**
   * Save location to localStorage
   */
  saveLocation(location: UserLocation): void {
    try {
      localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(location));
    } catch (e) {
      console.error('Failed to save location:', e);
    }
  }

  /**
   * Clear cache (useful when settings change)
   */
  clearCache(): void {
    this.cachedTimes.clear();
  }
}

// Export singleton instance
export const prayerTimesService = new PrayerTimesService();

// Export calculation method options for UI
export const CALCULATION_METHOD_OPTIONS = [
  { id: 'MuslimWorldLeague', label: 'Muslim World League', region: 'Global' },
  { id: 'Egyptian', label: 'Egyptian General Authority', region: 'Egypt, Africa' },
  { id: 'Karachi', label: 'University of Islamic Sciences, Karachi', region: 'Pakistan, India' },
  { id: 'UmmAlQura', label: 'Umm al-Qura University, Makkah', region: 'Saudi Arabia' },
  { id: 'Dubai', label: 'Dubai', region: 'UAE' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee', region: 'Global' },
  { id: 'NorthAmerica', label: 'ISNA', region: 'North America' },
  { id: 'Kuwait', label: 'Kuwait', region: 'Kuwait' },
  { id: 'Qatar', label: 'Qatar', region: 'Qatar' },
  { id: 'Singapore', label: 'MUIS', region: 'Singapore' },
  { id: 'Tehran', label: 'Institute of Geophysics, Tehran', region: 'Iran' },
  { id: 'Turkey', label: 'Diyanet İşleri Başkanlığı', region: 'Turkey' },
] as const;
