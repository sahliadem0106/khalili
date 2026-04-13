
import adhan from 'adhan';
const { Prayer, Coordinates, CalculationMethod, PrayerTimes } = adhan;

console.log('--- Adhan Enum Values ---');
console.log('Prayer.Fajr:', Prayer.Fajr);
console.log('Prayer.Sunrise:', Prayer.Sunrise);
console.log('Prayer.Dhuhr:', Prayer.Dhuhr);
console.log('Prayer.Asr:', Prayer.Asr);
console.log('Prayer.Maghrib:', Prayer.Maghrib);
console.log('Prayer.Isha:', Prayer.Isha);
console.log('Prayer.None:', Prayer.None);

// Current Time Simulation
const now = new Date();
console.log('--- Current Time ---');
console.log('Now:', now.toString());

// Test Coordinates (Tunis roughly)
const coords = new Coordinates(36.8665, 10.1647);
const params = CalculationMethod.MuslimWorldLeague();
const prayerTimes = new PrayerTimes(coords, now, params);

console.log('--- Prayer Times Today ---');
console.log('Fajr:', prayerTimes.fajr.toString());
console.log('Dhuhr:', prayerTimes.dhuhr.toString());
console.log('Asr:', prayerTimes.asr.toString());
console.log('Next Prayer object:', prayerTimes.nextPrayer(now));

console.log('--- Next Prayer Calculation ---');
const next = prayerTimes.nextPrayer(now);
console.log('nextPrayer(now) returns:', next);
