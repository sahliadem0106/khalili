# Critical Notification Flow (User A -> User B)

This flow covers **live critical events** (for example: `partner_request`) that must reach User B even when the app is not open.

## Use Case

- User A sends a partner request to User B.
- User B should receive a push notification quickly on device.

## Technical Sequence

1. User A triggers `PartnerService.sendRequest(fromUserId, toUserId, 'duo')`.
2. Frontend writes a doc in `requests` (pending request state).
3. Frontend writes a doc in `notifications` with type `partner_request`.
4. Firestore trigger (`functions/index.js`) runs on `notifications/{notificationId}` create.
5. Function checks whether `type` is in `CRITICAL_PUSH_TYPES`.
6. If critical:
   - Loads User B profile from `users/{toUserId}`.
   - Reads `fcmTokens`.
   - Sends push via Firebase Admin `sendEachForMulticast`.
7. Device(s) for User B receive OS push notification.
8. Invalid FCM tokens are removed from `users/{toUserId}.fcmTokens`.
9. In-app notification polling/listener can also pick up the same `notifications` doc for in-app UI state.

## Why this path is used

- Works when User B app is closed/backgrounded.
- Reserved for low-volume, high-priority social events.
- Keeps cost controlled because only critical types use Cloud Functions + FCM fanout.

