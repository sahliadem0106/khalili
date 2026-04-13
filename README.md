# khalili🌙

> A modern, mobile-first spiritual companion designed to help Muslims track prayers, build consistency, and find spiritual balance through data-driven insights and social accountability.

## 📖 About The Project

**khalili** is a holistic dashboard designed to improve the *quality* (Khushu) of your worship, not just the quantity. By combining habit-tracking psychology with Islamic principles, it helps users identify barriers to prayer, track their spiritual heart state, and stay accountable with friends and family via the **Rakib System**.

Built with **React 19**, **Tailwind CSS**, and **Firebase**, it features a beautiful, minimalist UI optimized for mobile devices and is ready for native mobile deployment via **Capacitor**.

## ✨ What Is Implemented (Features & Codebase Highlights)

### 🕌 Prayer Management & Calculation
*   **Offline Prayer Times:** Powered by the `adhan` library for accurate global timings based on GPS without needing an active API call.
*   **Smart Dashboard:** Countdown to the next prayer with a visual "Heart State" widget.
*   **Detailed Logging:** Track status (Jamaah, Home, Late, Missed, Qada) and update daily history.
*   **Quality Metrics:** Rate your *Khushu* (focus) and journal reflections for every prayer.

### 📿 Digital Tasbih, Duas & Quran
*   **Digital Tasbih:** Modes for Single Dhikr or "Fatima Combo", haptic feedback, ring animations, and presets (`TasbihPage`, `TasbihModal`).
*   **Husn Al Muslim (Duas):** Daily Dua widgets and a comprehensive library of supplications (`DuaPage`).
*   **Full Quran Reader:** Read the Mushaf with correct Arabic typography (`QuranReader`).
*   **Audio Player:** Built-in Quran audio player (`QuranAudioPlayer.tsx`).
*   **Tafsir Integration:** Read Tafsir for specific Ayahs.

### 👥 Rakib & Suhba System (Social Accountability)
*   **Partners:** Add friends to share progress (`DuoDashboard`, `PartnerConnect`).
*   **Security & Privacy:** Choose what you share (Minimal, Standard, or Full).
*   **Groups/Family Dashboard:** Create family or friend groups to compete on consistency streaks (`FamilyDashboard`, `SuhbaDashboard`).

### 📚 Tools & Analytics
*   **Habit Tracker & Goals:** Build consistent Islamic habits (`HabitTrackerPage`).
*   **Knowledge Hub:** Video lecture interface and study corner (`ContentHubPage`, `LecturesPage`, `StudySpacePage`).
*   **Qibla Finder:** Visual compass utilizing device geolocation (`LocationPicker.tsx`).
*   **Qada Tracker:** Track missed prayers and "make-up" progress.
*   **Analytics:** Weekly consistency charts, Khushu trends, and barrier breakdowns using `recharts`.

### ☁️ Data, Backend, & Mobile Setup (Firebase & Capacitor)
*   **Authentication:** Full user accounts via Firebase Auth (`AuthModal.tsx`).
*   **Cloud Database:** Real-time data persistence using Firebase Firestore (`DataSyncService.ts`, `SyncIndicator.tsx`).
*   **Internationalization (i18n):** Multi-language support and RTL styling via `i18next`.
*   **Mobile-Ready:** Local background notifications setup for Adhan via Capacitor platform.

## 🚧 What Is Missing / Incomplete (TODOs)

While the core platform is functional, the following features are still incomplete or pending development:

*   **FCM Remote Push Notifications:** While *local* notifications for Adhan are configured via Capacitor, remote push notifications (Firebase Cloud Messaging) for social "Nudges" to partners are still marked as a TODO.
*   **Family/Circle Lookup Logic:** The UI for Groups and Families exists, but the complex backend lookup/invitation logic needs finalization (`// TODO: Implement Family/Circle lookup` in codebase).
*   **Zakat Calculator:** Currently lacking from the primary UI; needs to be built into the tools section.
*   **Native App Integrations (Widgets):** Native Home Screen widgets for iOS and Android are planned but require native code (Swift/Kotlin) via Capacitor plugins.
*   **Advanced Offline Data Caching:** Offline-first caching for heavy content like Quran Audio and Tafsir data needs further refinement to limit user bandwidth usage.

---
*Made with ❤️ for the Ummah.*
