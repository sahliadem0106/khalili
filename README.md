
# Khalili 🌙

> **Your AI-Powered Spiritual Companion** for the Modern Muslim.

**Khalili** (My Close Friend) is a holistic Islamic lifestyle platform that bridges the gap between modern productivity tools and timeless spiritual wisdom. Unlike standard prayer apps, Khalili uses **Generative AI** to act as a spiritual mentor (*Murshid*), analyzing your habits, mood, and worship patterns to provide personalized, poetic, and actionable advice.

Built with **React**, **Tailwind CSS**, and the **Google Gemini API**.

---

## ✨ Key Features

### 🤖 Al-Murshid (AI Spiritual Companion)
*   **Context-Aware Chat:** A floating FAB opens a full-screen chat with "Al-Murshid," a wise persona that knows your name, location, and current "Heart State."
*   **Dynamic Advice:** The AI offers comfort using metaphors from nature and quotes from the Quran/Sunnah, tailored to your emotions.
*   **Smart Duas:** Describe your feeling (e.g., "anxious about exams"), and the AI generates a specific Dua with translation and spiritual context.

### 🌿 The Habit Engine (Istiqamah Tracker)
*   **Beyond Streaks:** Focuses on *Istiqamah* (steadfastness) and *Niyyah* (intention) rather than just checking boxes.
*   **The Spiritual Doctor:** When you log a habit (success or failure), the AI analyzes your reflection.
    *   *If you slipped:* It diagnoses the trigger (ego, environment, etc.) and prescribes a spiritual remedy.
    *   *If you succeeded:* It reminds you to offer Shukr (gratitude).
*   **Wisdom Cards:** Generates beautiful, shareable cards with poetic insights based on your daily logs.

### 📖 Immersive Quran Reader
*   **Mushaf Mode:** A clean, scrolling reading experience mimicking a physical Mushaf.
*   **Smart Navigation:** Jump between Surahs, Juz, or specific pages instantly.
*   **Rich Menu:** Tap any Ayah to bookmark, copy, or access (placeholder) Tafsir and audio.
*   **Visual Index:** Beautiful list view with revelation types (Meccan/Medinan) and juz markers.

### 🕌 Prayer & Worship Dashboard
*   **Precision Timing:** Calculates prayer times locally using the **Adhan.js** library (offline capable).
*   **Heart State Widget:** A unique visual indicator of your spiritual health based on prayer timeliness and Khushu (focus) ratings.
*   **Qada Tracker:** Keep track of missed prayers and your progress in making them up.
*   **Qibla Finder:** Sensor-fused compass with visual calibration guides.
*   **Digital Tasbih:** Haptic-feedback rosary with support for custom Dhikr sequences (Combos).

### 📊 Deep Analytics
*   **Khushu Trends:** Visual graphs showing the quality of your focus over time.
*   **Barrier Analysis:** Pie charts identifying what stops you from praying (Sleep, Work, etc.).
*   **Heatmaps:** GitHub-style consistency graphs for your prayers.

### 🤝 The Rakib System (Social)
*   **Accountability:** Add friends and family to track progress together.
*   **Privacy Controls:** Granular sharing levels (Minimal, Standard, Full).
*   **Leaderboards:** Healthy competition based on consistency streaks.

---

## 🛠️ Tech Stack

*   **Frontend Library:** React 18 (TypeScript)
*   **Styling:** Tailwind CSS (with extensive custom config for Dark Mode & Typography)
*   **AI Engine:** Google Gemini API (`gemini-2.5-flash`)
*   **Prayer Math:** `adhan` (Astronomical calculations)
*   **Charts:** Recharts
*   **Icons:** Lucide React
*   **Motion:** CSS Native Animations & Transitions

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16+)
*   A Google Gemini API Key (for AI features)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/khalili.git
    cd khalili
    ```

2.  **Install Dependencies**
    *(Note: This project uses direct ES modules via CDN for the prototype, but for local dev you might want a build step)*
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file and add your API key:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run**
    ```bash
    npm start
    ```

---

## 🎨 Design Philosophy

Khalili follows a **"Deen + Design"** philosophy:
1.  **Mobile First:** Designed for the thumb zone.
2.  **Dark Mode:** Fully supported for late-night worship (Qiyam).
3.  **Calm UI:** Uses nature-inspired colors (Forest Green, Mint, Amber, Rose) to induce tranquility.
4.  **Accessibility:** RTL (Right-to-Left) support for Arabic users.

---

*Made with ❤️ for the Ummah.*
