# Unified Notification Flow (Mermaid Sequence)

This diagram shows how the app routes social notifications between:

- **Critical live events** -> Firestore `notifications` + Cloud Function + FCM push
- **Scheduled reminders** -> Firestore `socialNotificationPolicies` + local scheduler

```mermaid
sequenceDiagram
    autonumber
    participant UA as User A (Sender App)
    participant FE as Frontend Services
    participant FS as Firestore
    participant CF as Cloud Function (sendPushNotification)
    participant FCM as Firebase Cloud Messaging
    participant UB as User B Device/App
    participant SCH as SocialNotificationScheduler
    participant NS as NotificationService

    UA->>FE: Trigger social action (request/reminder/broadcast)
    FE->>FE: Determine notification class

    alt Critical live event\n(partner_request/invite/request_accepted/request_rejected)
        FE->>FS: Create notifications doc {type,toUserId,...}
        FS-->>CF: onDocumentCreated(notifications/{id})
        CF->>CF: Check CRITICAL_PUSH_TYPES
        CF->>FS: Load users/{toUserId}.fcmTokens
        alt Tokens exist
            CF->>FCM: sendEachForMulticast(tokens,payload)
            FCM-->>UB: OS push delivered
            CF->>FS: Remove invalid tokens (if any)
        else No tokens
            CF-->>CF: Exit gracefully (no push)
        end
        UB->>FE: Optional in-app open/read flow
    else Scheduled social reminder\n(adhan_reminder/reminder/broadcast policy)
        FE->>FS: Create socialNotificationPolicies doc
        UB->>SCH: startAutoRefresh(userId) on login
        SCH->>FS: fetchPoliciesForUser(userId)
        FS-->>SCH: Matching policies (user/group/partnership audience)
        SCH->>SCH: Apply mute scopes + quiet hours + enabled checks
        SCH->>SCH: Diff policy hash vs previous state
        SCH->>NS: Cancel outdated scheduled IDs
        SCH->>NS: Schedule next notifications from active rules
        alt Android native
            NS-->>UB: Capacitor Local Notifications
        else Web
            NS-->>UB: setTimeout + browser notification
        end
    end
```

## Routing Rule (simple)

- If event is in critical set -> **Cloud push path**
- Otherwise for scheduled/social reminder behaviors -> **Policy + local scheduler path**

## Notes

- This hybrid design minimizes backend cost for recurring reminders.
- Critical events still reach users when app is closed.
- Local policy path supports user controls (mute scopes, quiet hours, sync toggle).

