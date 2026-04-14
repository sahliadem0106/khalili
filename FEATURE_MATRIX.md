# Muslim Daily Feature Matrix

This document maps user-facing features to screens, main services, data stores, and backend triggers.

## 1) Authentication and User Profile

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Google Sign-In | Sign in with Google (web + native) | Onboarding/Auth entry | `AuthService`, `useAuth` | Firebase Auth, `users/{uid}` |
| Session restore | Stay logged in across app restarts | App root | `AuthService.initAuthListener()` | Firebase Auth persisted session |
| Profile management | Save name, gender, age, bio, links, avatar | Profile + onboarding forms | `AuthService.updateProfile()`, `updateSettings()` | Firestore `users` |
| New/existing user routing | Skip onboarding for complete profiles; force onboarding if incomplete | `App`, `OnboardingFlow` | profile completeness checks | `users` document fields |

## 2) Prayer Times and Daily Prayer Actions

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Prayer time calculation | View Fajr/Dhuhr/Asr/Maghrib/Isha for current location | Home (`PrayerCard`, `PrayerList`) | `PrayerTimesService`, `usePrayerTimes` | Local cache/settings |
| Methods/juristic choices | Choose calc method and Asr method | Settings | `PrayerTimesService` settings | Local + Firestore settings |
| Log prayer outcome | Mark prayer as jamaah/home/late/missed/qada | `PrayerDetailModal`, home list | `updatePrayer` flow + `PrayerLogService` | Local logs + Firestore sync |
| Next prayer countdown | Live countdown to next prayer | Home hero/card | `PrayerTimesService.startCountdown()` | Runtime only |

## 3) Notifications and Adhan

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Prayer reminders | Enable/disable per prayer reminder | Notification settings | `NotificationService` | Local settings |
| Reminder timing | Notify at time, 5/10/15/30 mins before | Notification settings | `NotificationService.schedulePrayerNotifications()` | Local schedule + native/local notif |
| Android background local notifications | Receive scheduled local notifications with app backgrounded | Android app | `@capacitor/local-notifications`, `NotificationService` | Android OS scheduler |
| Day rollover hardening | Auto-reschedule next day reminders | App lifecycle | `usePrayerTimes` visibility/focus/minute checks | Local runtime logic |
| Adhan overlay | See in-app adhan modal at prayer time | `AdhanOverlay` | `AdhanContext`, `AdhanManager`, `AudioService` | Notification settings + local state |

## 4) Prayer History and Sync

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Local-first tracking | Use app offline and retain prayer history | Whole app | `LocalStorageService`, `PrayerLogService` | Browser/device local storage |
| Cloud sync | Push/pull prayer and profile data | Auto + profile sync action | `useSyncManager`, `DataSyncService` | Firestore `users/{uid}/prayerLogs` |
| Migration from guest | Keep old local data after sign-in | First login flow | `useSyncManager.migrateGuestData()` | Firestore merge + import |
| Historical restore | Restore old prayer history on new device | Sync flow | `dataSyncService.getAllPrayerLogs()`, `prayerLogService.importLogs()` | Firestore prayer logs |

## 5) Quran Reader and Audio

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Read mushaf pages | Navigate by surah, juz, and page | `QuranReader` | `MUSHAF_DATA` + virtualized rendering | Local bundled data |
| Verse actions | Play verse, open tafsir, add reflection | Ayah action sheet | `useQuranAudio`, `useTafsir`, `useReflections` | Firestore reflections |
| Audio controls | Change reciter, speed, repeat mode | `QuranAudioPlayer`, settings | `QuranAudioService` | Local settings |
| Continuous play hardening | Continue next ayah even when total ayah count not passed by caller | Quran audio flow | `QuranAudioService.resolveSurahAyahCount()` | Local logic |
| Tafsir and translation source | Pick preferred tafsir/translation | Settings | `TafsirService` | localStorage + profile settings |

## 6) Dua, Tasbih, Qibla, Qada

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Dua browsing | Search/read duas by category | `DuaPage` | local dua data/utils | Local bundled data |
| Tasbih counting | Perform dhikr sessions | `TasbihPage`, `TasbihModal` | `TasbihLogService` | Local + optional sync hooks |
| Qibla direction | Find Qibla direction from device sensors/location | `QiblaFinder` | `useQibla`, `LocationService` | Device APIs |
| Qada tracking | Track missed/made-up counts | `QadaTracker` | `useQada` | Local + synced profile stats |

## 7) Study and Habits

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Study sessions | Run focus sessions and log minutes | `StudySpacePage` | `StudyService` | localStorage |
| Study streak/calendar | View study activity patterns | Study tabs | `StudyService` aggregates | localStorage |
| Habit tracking | Track custom habits | `HabitTrackerPage` | habit-related service/hooks | localStorage (+ optional cloud) |

## 8) Partners, Family, and Suhba Social

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Partner profile | Create public/private partner profile | Partner setup pages | `PartnerService` | `partnerProfiles` |
| Connection requests | Send/receive/accept/reject requests | Partner pages + requests center | `PartnerService.sendRequest/respondToRequest` | `requests`, `partnerships`, `notifications` |
| QR connect | Connect by QR code | Partner connect views | `PartnerService.getProfileByQRCode` | `partnerProfiles` |
| Group activity | Family/Suhba groups, broadcasts, reminders | Family/Suhba dashboards | `FamilyService`, `SuhbaService` | `groups`, `broadcasts`, `challenges`, `notifications` |
| Adhan reminders to others | Send prayer reminder to partner/family/circle | Adhan overlay actions | `PartnerService.sendAdhanReminder` | `notifications` |

## 9) Gamification and Badges

| Area | User Can Do | Frontend Screens | Services/Logic | Backend/Data |
|---|---|---|---|---|
| Earn badges | Unlock progress badges for prayer/streak/study/tasbih/social | Badge UI + toast | `BadgeService`, `BadgeToastProvider` | localStorage stats |
| View unlocked badges | See collected badges and progress | profile badges section | `BadgeService.getEarnedBadges()` | localStorage |
| Trigger points | Badge stats update on relevant actions | prayer/tasbih/study/social flows | `PrayerLogService`, `TasbihLogService`, `StudyService`, `PartnerService`, `SuhbaService` | local badge state |

## 10) Backend Eventing

| Trigger | What Happens | Code |
|---|---|---|
| New Firestore `notifications/{id}` doc with critical type | Cloud Function sends FCM multicast to target user tokens (`fcmTokens`) and cleans invalid tokens | `functions/index.js` |

## 11) Local Rule-Based Social Notifications (New)

| Area | User Can Do | Frontend/Client Logic | Backend/Data |
|---|---|---|---|
| Policy-driven reminders | Admin-style reminders across partner/family/suhba without per-event push | `SocialNotificationPolicyService`, `SocialNotificationScheduler` | `socialNotificationPolicies` collection |
| Rule types | Hourly, daily-time, prayer-linked, one-time reminders | scheduler compile + local schedule/cancel diff | policy docs (`ruleType`, `dailyTime`, `hourlyIntervalMinutes`, `prayerName`) |
| User controls | Mute scopes, quiet hours, sync toggle | `NotificationSettings` + `NotificationService.socialNotificationDelivery` | local settings persistence |
| Lifecycle sync | Reconcile policies on login and periodic refresh | `App.tsx` (`socialNotificationScheduler.startAutoRefresh`) | Firestore policy reads |
| Cost optimization | Most social reminders delivered locally | local scheduling on device | push used for critical events only |

## 12) Primary Firestore Collections in Current App

- `users` (profile/settings and subcollection `prayerLogs`)
- `notifications`
- `socialNotificationPolicies`
- `partnerProfiles`
- `partnerships`
- `requests`
- `groups`
- `broadcasts`
- `socialShareRequests`
- `invites`
- `challenges`

