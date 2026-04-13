# Khalil App - Complete Data Architecture

## Core Principle: **REAL DATA ONLY** - All metrics computed from actual user actions

---

## Data Persistence Status ✅ ALL IMPLEMENTED

| Feature | Service | Storage | Status |
|---------|---------|---------|--------|
| Prayer Logs | `PrayerLogService` | localStorage | ✅ |
| Prayer Times | `PrayerTimesService` | localStorage | ✅ |
| Metrics | `MetricsService` | Computed + cached | ✅ |
| Quran Progress | `LocalStorageService` | localStorage | ✅ |
| Habits | `HabitService` | localStorage | ✅ |
| Study | `StudyService` | localStorage | ✅ |
| Goals | `GoalsService` | Firebase | ✅ |
| Tasbih | `TasbihLogService` | localStorage | ✅ |
| Partners | `PartnerService` | Firebase | ✅ |
| Content | `ContentService` | localStorage | ✅ |
| Lectures | `LecturesService` | localStorage | ✅ |
| Settings | `LocalStorageService` | localStorage | ✅ |
| Location | `LocationService` | localStorage | ✅ |
| Notifications | `NotificationService` | localStorage | ✅ |

---

## 1. Prayer System

### PrayerLogService (`services/PrayerLogService.ts`)
```typescript
interface PrayerLogEntry {
  date: string;           // 'YYYY-MM-DD'
  prayerId: string;       // 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
  status: PrayerStatus;
  khushuLevel: number;    // 0=not rated, 1-5
  barrier: string | null;
  completedAt: string;
}
```
**Storage Key:** `khalil_prayer_logs`

---

## 2. Computed Metrics

### MetricsService (`services/MetricsService.ts`)
```typescript
interface UserMetrics {
  prayerStreak: number;   // Consecutive days
  heartState: number;     // 0-100
  onTimeRate: number;     // 0-100%
  avgKhushu: number;      // 0-5
  totalPrayers: number;
  level: number;          // 1-10
}
```
**Computed from:** PrayerLogService data

---

## 3. Quran Progress

### LocalStorageService (`services/LocalStorageService.ts`)
```typescript
interface QuranProgress {
  lastRead: { surah, ayah, page, timestamp } | null;
  bookmarks: Array<{ surah, ayah, note, timestamp }>;
}
```
**Storage Key:** `khalil_app_data` → quranProgress

---

## 4. Habits

### HabitService (`services/HabitService.ts`)
```typescript
interface Habit { id, name, type, frequency, days?, icon, color, active }
interface HabitLog { habitId, date, completed }
```
**Storage Keys:** `khalil_habits`, `khalil_habit_logs`

---

## 5. Study

### StudyService (`services/StudyService.ts`)
```typescript
interface Subject { id, name, color }
interface Task { id, title, subject, dueDate, priority, done }
interface Note { id, title, content, subject?, tags[] }
interface Card { id, deckId, front, back, nextReview, interval }
interface FocusSession { id, subject, duration, date }
```
**Storage Keys:** `khalil_study_*`

---

## 6. Goals

### GoalsService (`services/GoalsService.ts`) - FIREBASE
```typescript
interface Goal { id, title, category, frequency, targetCount, currentCount, streak, status }
interface GoalLog { goalId, date, count, note? }
```
**Firestore:** `/users/{uid}/goals`, `/users/{uid}/goalLogs`

---

## 7. Tasbih

### TasbihLogService (`services/TasbihLogService.ts`)
```typescript
interface TasbihSession { id, dhikr, dhikrArabic, count, target, mode, completedAt }
```
**Storage Key:** `khalil_tasbih_sessions`

---

## 8. Partners

### PartnerService (`services/PartnerService.ts`) - FIREBASE
```typescript
interface Partnership { id, user1Id, user2Id, status, createdAt }
```
**Firestore:** `/partnerships/{id}`, `/partnerRequests/{id}`

---

## 9. Content & Lectures

### ContentService + LecturesService
```typescript
interface WatchProgress { contentId, progress, completed, lastWatched }
interface WatchHistory { lectureId, watchedAt, progress }
```
**Storage Keys:** `khalil_content_progress`, `khalil_watch_history`

---

## 10. Settings

### LocalStorageService + PrayerTimesService
```typescript
interface UserSettings {
  calculationMethod, asrMethod, adjustments,
  notificationsEnabled, prayerReminders,
  language, theme
}
```
**Storage Keys:** `khalil_app_data`, `khalil_prayer_settings`

---

## localStorage Keys Summary

| Key | Data |
|-----|------|
| `khalil_app_data` | Unified: prayers, user, quran, settings |
| `khalil_prayer_logs` | Prayer history |
| `khalil_habits` | Habit definitions |
| `khalil_habit_logs` | Habit completions |
| `khalil_study_*` | Study data (6 keys) |
| `khalil_tasbih_sessions` | Dhikr sessions |
| `khalil_content_progress` | Video watch progress |
| `khalil_watch_history` | Lecture history |
| `khalil_prayer_settings` | Calculation method |
| `khalil_location` | User location |
