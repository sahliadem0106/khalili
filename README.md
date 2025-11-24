# Khalili: AI-Driven Islamic Spiritual Platform

Khalili is a progressive web application (PWA) designed to integrate modern productivity frameworks with Islamic spiritual practices. It leverages Google's Gemini Generative AI to provide context-aware mentorship, behavioral analysis, and dynamic religious resources.

The application is built with a mobile-first design philosophy, focusing on privacy (local computation), accessibility (RTL support), and offline capability for core functions.

## Key Features

### 1. Generative AI Spiritual Mentorship (Al-Murshid)
*   **Context-Aware Chat Interface:** Implements a persistent chat session that retains user context, including location, current time, and calculated "Heart State."
*   **Persona Engineering:** Utilizes sophisticated system instructions to condition the LLM as a compassionate, poetic spiritual mentor rather than a generic assistant.
*   **Streaming Responses:** Implements real-time text streaming for a natural conversational experience.

### 2. Behavioral Habit Engine
*   **Root Cause Analysis:** Unlike standard binary trackers, this engine analyzes user reflections upon failure. The AI diagnoses the trigger (e.g., environment, stress) and prescribes actionable spiritual remedies.
*   **Intention (Niyyah) Tracking:** Enforces the declaration of intent for every habit, grounding productivity in spiritual purpose.
*   **Dynamic Feedback:** Generates "Wisdom Cards" containing personalized advice based on the specific success or failure state of the user.

### 3. Immersive Quranic Interface
*   **Mushaf View:** A high-performance, infinite-scrolling view mimicking the physical Mushaf layout.
*   **Rich Interaction:** Features verse-level interaction for bookmarking, copying, and reflection logging.
*   **Navigation System:** Implements a drawer-based navigation system for rapid access to specific Surahs, Juz, or Hizb.

### 4. Algorithmic Prayer Dashboard
*   **Local Calculation:** Uses the `adhan` library to calculate astronomical prayer times locally on the client device, ensuring privacy and offline functionality.
*   **Heart State Algorithm:** A proprietary logic that calculates a spiritual health score (0-100%) based on prayer timeliness, frequency, and self-reported Khushu (focus).
*   **Qada (Missed Prayer) Management:** A persistent tracker for calculating and managing missed prayers over time.

### 5. Sensor-Fused Qibla Direction
*   **Great Circle Calculation:** Utilizes the Haversine formula to calculate the precise bearing to the Kaaba based on device GPS coordinates.
*   **Sensor Integration:** Accesses device magnetometer and accelerometer data (DeviceOrientation API) to provide real-time compass feedback.

## Technical Stack

*   **Core Framework:** React 18 (TypeScript)
*   **Build Tooling:** Vite (implied via usage patterns)
*   **Styling:** Tailwind CSS with custom configuration for Dark Mode and Typography.
*   **AI Integration:** Google GenAI SDK (`@google/genai`).
*   **Astronomical Math:** `adhan` library for solar calculation.
*   **Data Visualization:** Recharts for statistical analysis.
*   **State Management:** React Context API and LocalStorage for persistence.

## Architecture and Design Decisions

*   **Privacy-First:** Location data and prayer logs are processed and stored entirely within the browser's LocalStorage. No personal data is sent to an external server except for the anonymized prompts sent to the LLM.
*   **Modular Component Structure:** The codebase is organized into discrete feature modules (Habits, Prayers, Chat, Quran) to ensure maintainability and scalability.
*   **Responsive Design:** The UI utilizes Tailwind's responsive prefixes to ensure full compatibility across mobile, tablet, and desktop viewports.

## License

This project is licensed under the MIT License.
