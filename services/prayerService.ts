
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { Prayer, PrayerStatus, PrayerSettings, CalculationMethod as MethodName } from '../types';

// Map our internal method names to Adhan's CalculationMethod functions
const getCalculationParameters = (methodName: MethodName) => {
  switch (methodName) {
    case 'MuslimWorldLeague': return CalculationMethod.MuslimWorldLeague();
    case 'Egyptian': return CalculationMethod.Egyptian();
    case 'Karachi': return CalculationMethod.Karachi();
    case 'UmmAlQura': return CalculationMethod.UmmAlQura();
    case 'Dubai': return CalculationMethod.Dubai();
    case 'MoonsightingCommittee': return CalculationMethod.MoonsightingCommittee();
    case 'NorthAmerica': return CalculationMethod.NorthAmerica();
    case 'Kuwait': return CalculationMethod.Kuwait();
    case 'Qatar': return CalculationMethod.Qatar();
    case 'Singapore': return CalculationMethod.Singapore();
    case 'Turkey': return CalculationMethod.Turkey();
    case 'Tehran': return CalculationMethod.Tehran();
    case 'Other': return CalculationMethod.Other();
    default: return CalculationMethod.MuslimWorldLeague();
  }
};

// Fallback logic if no settings provided (or for initial load)
const getMethodForLocation = (lat: number, long: number) => {
  try {
    // North America
    if (lat > 12 && lat < 72 && long > -180 && long < -30) {
      return { params: CalculationMethod.NorthAmerica(), name: 'North America' };
    }
    // UK & Ireland (Approximation)
    if (lat > 50 && lat < 60 && long > -10 && long < 2) {
      return { params: CalculationMethod.MoonsightingCommittee(), name: 'Moonsighting Committee' }; 
    }
    // Egypt
    if (lat > 22 && lat < 32 && long > 25 && long < 35) {
      return { params: CalculationMethod.Egyptian(), name: 'Egyptian' };
    }
    // Pakistan / India
    if (lat > 8 && lat < 37 && long > 60 && long < 97) {
      return { params: CalculationMethod.Karachi(), name: 'Karachi' };
    }
    // Saudi Arabia (Umm Al Qura)
    if (lat > 16 && lat < 32 && long > 34 && long < 56) {
      return { params: CalculationMethod.UmmAlQura(), name: 'Umm Al Qura' };
    }
    // Turkey
    if (lat > 36 && lat < 42 && long > 26 && long < 45) {
      return { params: CalculationMethod.Turkey(), name: 'Turkey' };
    }
  } catch (e) {
    console.warn("Error determining calculation method, defaulting to MWL", e);
  }
  
  // Default global standard
  return { params: CalculationMethod.MuslimWorldLeague(), name: 'Muslim World League' };
};

export const fetchPrayerTimes = async (lat: number, long: number, settings?: PrayerSettings): Promise<{
  prayers: Prayer[];
  hijriDate: string;
  locationName: string;
  methodName: string;
} | null> => {
  try {
    // Validate inputs
    if (typeof lat !== 'number' || typeof long !== 'number') {
      throw new Error("Invalid coordinates");
    }

    const coordinates = new Coordinates(lat, long);
    const date = new Date();
    
    let params;
    let methodName = 'Auto-Calculated';

    if (settings) {
       // Use User Settings
       params = getCalculationParameters(settings.method);
       methodName = settings.method.replace(/([A-Z])/g, ' $1').trim(); // Un-camelCase
       
       // Set Madhab (Asr)
       if (settings.madhab === 'Hanafi') {
          params.madhab = Madhab.Hanafi;
       } else {
          params.madhab = Madhab.Shafi; // Standard
       }

       // Set Adjustments (Offsets)
       if (settings.offsets) {
          params.adjustments.fajr = settings.offsets.fajr;
          params.adjustments.sunrise = settings.offsets.sunrise;
          params.adjustments.dhuhr = settings.offsets.dhuhr;
          params.adjustments.asr = settings.offsets.asr;
          params.adjustments.maghrib = settings.offsets.maghrib;
          params.adjustments.isha = settings.offsets.isha;
       }

    } else {
       // Fallback Auto-Detection
       const auto = getMethodForLocation(lat, long);
       params = auto.params;
       methodName = auto.name;
    }
    
    if (!params) {
        console.warn("Calculation parameters unavailable, aborting prayer fetch");
        return null;
    }

    const prayerTimes = new PrayerTimes(coordinates, date, params);

    // Helper to format time to HH:MM (24h)
    const formatTime = (d: Date) => {
      if (!d || isNaN(d.getTime())) return "--:--";
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    // Helper to determine status
    const getStatusForTime = (prayerDate: Date): PrayerStatus => {
        const now = new Date();
        if (!prayerDate) return PrayerStatus.Upcoming;
        return prayerDate < now ? PrayerStatus.Missed : PrayerStatus.Upcoming;
    };

    // Calculate Hijri Date locally using Intl API with robust fallback
    let hijriDateStr = "";
    try {
      // Check if Intl and Hijri calendar supported
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
          try {
             if (Intl.DateTimeFormat.supportedLocalesOf(['en-TN-u-ca-islamic']).length > 0) {
                const hijriFormatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                hijriDateStr = hijriFormatter.format(date).replace(' AH', '');
             }
          } catch (localeError) {
             // Ignore locale error and fall through to default
          }
      }
    } catch (e) {
      console.warn("Hijri date calculation failed", e);
    }

    // Final fallback for date
    if (!hijriDateStr) {
       hijriDateStr = date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
       });
    }

    // Construct Prayer Array
    const prayers: Prayer[] = [
      { 
        id: "fajr", 
        name: "Fajr", 
        arabicName: "الفجر", 
        time: formatTime(prayerTimes.fajr), 
        status: getStatusForTime(prayerTimes.fajr) 
      },
      { 
        id: "dhuhr", 
        name: "Dhuhr", 
        arabicName: "الظهر", 
        time: formatTime(prayerTimes.dhuhr), 
        status: getStatusForTime(prayerTimes.dhuhr) 
      },
      { 
        id: "asr", 
        name: "Asr", 
        arabicName: "العصر", 
        time: formatTime(prayerTimes.asr), 
        status: getStatusForTime(prayerTimes.asr) 
      },
      { 
        id: "maghrib", 
        name: "Maghrib", 
        arabicName: "المغرب", 
        time: formatTime(prayerTimes.maghrib), 
        status: getStatusForTime(prayerTimes.maghrib) 
      },
      { 
        id: "isha", 
        name: "Isha", 
        arabicName: "العشاء", 
        time: formatTime(prayerTimes.isha), 
        status: getStatusForTime(prayerTimes.isha) 
      },
    ];

    // Determine "Next" prayer
    const now = new Date();
    let nextFound = false;
    
    const times = [prayerTimes.fajr, prayerTimes.dhuhr, prayerTimes.asr, prayerTimes.maghrib, prayerTimes.isha];
    
    const updatedPrayers = prayers.map((p, index) => {
        const pTime = times[index];
        if (!nextFound && pTime && pTime > now) {
            nextFound = true;
            return { ...p, isNext: true };
        }
        return { ...p, isNext: false };
    });

    // If no next prayer found today (after Isha), mark Fajr
    if (!nextFound) {
        updatedPrayers[0].isNext = true;
    }

    return {
        prayers: updatedPrayers,
        hijriDate: hijriDateStr,
        locationName: "Local Coordinates", 
        methodName: methodName
    };

  } catch (error) {
    console.error("Prayer Calculation Error:", error);
    return null;
  }
};
