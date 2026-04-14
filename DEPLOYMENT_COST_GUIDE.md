# Deployment and Cost Guide (Firebase + Vite + Capacitor)

This guide is practical for your current codebase and budget constraints.

---

## 1) Deployment Architecture (Current)

- Frontend: Vite app deployed to Firebase Hosting (`dist`)
- Backend: Firebase Cloud Functions (`functions/index.js`)
- Database: Firestore (rules + indexes)
- Auth: Firebase Authentication (Google)
- Push:
  - Cloud Function sends FCM on new `notifications` docs
  - Android local scheduling via Capacitor Local Notifications

---

## 2) Pre-Deployment Checklist

## Required Env

Create `.env` from `.env.example` and fill:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Recommended:

- `VITE_FIREBASE_VAPID_KEY` (web push reliability)
- `VITE_METAL_PRICE_API_KEY` (live Zakat metal prices, has fallback if absent)

## Firebase Console Setup

- Enable Authentication providers (Google)
- Create Firestore in production mode
- Ensure Firestore rules/indexes are ready
- Ensure Cloud Messaging is enabled

---

## 3) Web Deployment Steps

```bash
npm install
npm run build
firebase deploy --only hosting
firebase deploy --only firestore
```

If first deploy for functions:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Recommended full deploy command once stable:

```bash
firebase deploy --only hosting,firestore,functions
```

---

## 4) Android Deployment Steps (Capacitor)

After dependency/plugin updates:

```bash
npm run build
npx cap sync android
```

Then open Android project and build:

```bash
npx cap open android
```

Verify:
- Notification permission prompt works (Android 13+)
- Prayer local notification schedules in future
- Notification cancellation/updates work when settings change

---

## 5) Suggested Release Pipeline

## Stage A: Staging Project

- Use a separate Firebase project for staging
- Deploy there first and run smoke tests

## Stage B: Production Deploy

- Deploy firestore rules + indexes first
- Deploy functions
- Deploy hosting

## Stage C: Post-Deploy QA

- Sign in/out
- Prayer logging and streak check
- Notification test
- Quran audio + tafsir settings check
- Partner request + notification flow

---

## 6) Cost Model: What You May Pay For

Important: prices change by region/date. Always verify on official Firebase pricing pages for your project region.

## Core Potential Cost Buckets

1. **Firestore**
- Reads, writes, deletes
- Stored data size
- Network egress

2. **Cloud Functions**
- Invocations
- Compute time
- Outbound network

3. **Hosting**
- Storage
- Bandwidth egress

4. **Authentication**
- Usually low cost at early scale; check provider-specific terms and MAU limits

5. **External APIs**
- `metalpriceapi.com` for live Zakat prices may have paid tiers if usage grows

6. **Domain**
- Custom domain registration cost (annual), SSL via Firebase is generally included

---

## 7) Your App’s Main Cost Drivers

For this codebase, the highest risk costs are:

- Firestore notification listener/read volume
- Prayer/social feature writes (notifications, requests, group activity)
- Cloud Function triggers on `notifications/{id}`
- Hosting bandwidth if app traffic grows quickly

## New Architecture Note (Implemented)

- Social reminder delivery is now primarily policy-driven and local on device.
- Firestore stores reminder policies in `socialNotificationPolicies`.
- Client scheduler reconciles and compiles policies into local notifications.
- Cloud push is filtered to critical live types only in `functions/index.js`.

Cost effect:
- Lower function invocations and lower per-reminder backend writes.
- Main recurring cost becomes periodic policy reads (typically much cheaper than live push for each reminder).

Lower-risk/mostly-free early:

- FCM push send volume is often effectively free for many startup stages
- Local Android notifications are device-side and do not consume backend events

---

## 8) Budget Strategy with Limited Cash + Firebase Credits

Given you have limited budget + temporary credit runway:

## Phase 1 (Now, MVP)
- Stay conservative on writes
- Keep payloads small
- Use one Firebase project for prod only when stable
- Add usage alerts immediately

## Phase 2 (Before credits end)
- Monitor monthly trend in:
  - Firestore reads/writes
  - Function invocations
  - Hosting egress
- Optimize top 2 expensive operations before credits expire

## Phase 3 (Sustainable baseline)
- Keep free/low-cost mode:
  - aggressive caching
  - avoid unnecessary listeners
  - avoid duplicate writes

---

## 9) Practical Cost Controls (High Impact)

1. **Firestore read reduction**
- Keep queries targeted and indexed
- Avoid duplicate listeners for same data
- Prefer one listener + local state fanout

2. **Write reduction**
- Debounce high-frequency writes (already partially done)
- Batch updates where possible
- Avoid writing unchanged fields

3. **Function control**
- Trigger only on needed documents
- Keep function lightweight and short-running
- Add guard clauses early (already present)

4. **Hosting bandwidth**
- Use compressed builds
- Avoid oversized static assets
- Consider CDN cache headers for immutable assets

5. **Monitoring/alerts**
- Set budget alerts in Google Cloud Billing
- Set Firebase usage alerts

---

## 10) Expected Cost Scenarios (Rough Planning)

These are directional, not billing quotes.

## Small launch (friends/family, low daily active)
- Likely very low spend, often near free-tier behavior

## Moderate growth (few hundred to low-thousand active users)
- Firestore operations become visible cost center first
- Functions usually still manageable if payloads are simple

## Large growth
- Firestore + bandwidth dominate unless heavily optimized

---

## 11) Recommended Immediate Actions

1. Add billing budget alerts now (50%, 75%, 90%, 100%)
2. Track weekly:
- Firestore reads/writes
- Function invocations
- Hosting egress
3. Keep staging and production separated
4. Run one end-to-end Android notification verification after each release
5. Monitor `socialNotificationPolicies` read volume and tune scheduler sync interval if needed

---

## 12) Commands Cheat Sheet

```bash
# Build web
npm run build

# Deploy only frontend hosting
firebase deploy --only hosting

# Deploy rules + indexes
firebase deploy --only firestore

# Deploy functions
firebase deploy --only functions

# Capacitor Android sync
npx cap sync android
```

