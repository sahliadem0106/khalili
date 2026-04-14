# Local Policy Notification Flow (User A -> User B)

This flow covers **scheduled Deen reminders** (partner/family/suhba) using local policy sync and local scheduling.

## Use Case

- User A sends an Adhan reminder to User B.
- User B gets a scheduled local notification based on social policy rules.

## Technical Sequence

1. User A triggers a social reminder action (for example via `PartnerService.sendAdhanReminder`).
2. Frontend creates a policy doc in `socialNotificationPolicies` (rule type: `prayerLinked` or `oneTime`).
3. User B signs in (or already has app open):
   - `App.tsx` starts `socialNotificationScheduler.startAutoRefresh(userId)`.
   - Optional migration runs once (`SocialNotificationMigrationService`) for legacy docs.
4. Scheduler calls `socialNotificationPolicyService.fetchPoliciesForUser(userId)`.
5. Service gathers audience-matching policies:
   - direct user audience (`audience.userIds`),
   - partnership audience (`audience.partnershipId`),
   - group audience (`audience.groupId` for family/suhba).
6. Scheduler filters by:
   - enabled policies only,
   - user muted scopes,
   - quiet hours settings.
7. Scheduler compiles each policy into one or more local notification IDs.
8. Scheduler diffs by policy hash:
   - cancels old scheduled IDs,
   - schedules new IDs through `NotificationService`.
9. Delivery layer:
   - Android native: Capacitor Local Notifications.
   - Web fallback: in-tab timer scheduling.

## Why this path is used

- Avoids per-reminder Cloud Function invocations.
- Supports user-level delivery controls (mute scopes, quiet hours, sync toggle).
- Better cost profile for recurring social reminders.

## Refresh Behavior

- Immediate reconcile on login.
- Periodic reconcile every 5 minutes.
- Manual/setting-driven resync via scheduler lifecycle hooks.

