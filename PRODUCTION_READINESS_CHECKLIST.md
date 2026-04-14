# Production Readiness Checklist

Updated: 2026-04-14

## Deployment Status

- [x] Firestore rules deployed (`firebase deploy --only firestore`)
- [x] Firestore indexes deployed
- [ ] Functions deployed after latest notification/rules hardening (blocked: project must upgrade to Blaze plan to enable `cloudbuild.googleapis.com`)
- [x] Hosting deployed after latest changes (`https://khalili-v01.web.app`)

## Build and Code Health

- [x] `npm run build` passes
- [x] Lint diagnostics show no errors on changed files
- [x] Rules/schema alignment fixed for:
  - partnerships (`users` field)
  - broadcasts (`fromUserId`)
  - notification updates (recipient can update read/delivered)
  - social policy create flow (sender -> recipient user audience)
  - request and social-share request transition safety

## Environment and Credentials

Validated from local `.env` (values not exposed):

- [x] `VITE_FIREBASE_API_KEY` set
- [x] `VITE_FIREBASE_AUTH_DOMAIN` set
- [x] `VITE_FIREBASE_PROJECT_ID` set
- [x] `VITE_FIREBASE_STORAGE_BUCKET` set
- [x] `VITE_FIREBASE_MESSAGING_SENDER_ID` set
- [x] `VITE_FIREBASE_APP_ID` set
- [ ] `VITE_FIREBASE_VAPID_KEY` missing (needed for reliable web push)
- [ ] `VITE_METAL_PRICE_API_KEY` missing (needed for live Zakat prices)

## Android Credentials and Console Setup

- [x] `android/app/google-services.json` present
- [ ] Firebase Console: verify Android app SHA-1/SHA-256 fingerprints are configured
- [ ] Firebase Console: verify Cloud Messaging is enabled
- [ ] Firebase Console: verify Google Sign-In provider is enabled

## Security and Access Control

- [x] Firestore rule mismatches causing permission failures were fixed
- [x] Request status transitions are now constrained to recipient-only and pending-only
- [ ] If repo is public: restrict Google API key usage in GCP (HTTP referrer/app restrictions)
- [ ] If repo is public: rotate exposed API key material if not properly restricted

## Feature/Behavior Verification (Manual QA)

- [ ] Partner request -> accept/reject flow (real devices/users)
- [ ] Social policy reminders: creation, schedule, disable/delete, quiet hours
- [ ] Android local notification scheduling/cancel behavior
- [ ] Prayer historical restore on fresh login/device
- [ ] Invite create/use/deactivate/delete permissions
- [ ] Goals guest mode: confirm friendly sign-in prompt behavior

## Artifacts

- [x] `frontend_export.txt` regenerated
- [x] `backend_export.txt` regenerated

## Optional Follow-Up Improvements

- [ ] Add web push VAPID registration path (currently key exists in config template but no active registration usage)
- [ ] Replace client-side "mock payment gate" in family creation with server-side verification
- [ ] Reduce bundle size (current build warns about large chunk size)

