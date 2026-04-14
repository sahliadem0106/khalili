const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const {CRITICAL_PUSH_TYPES} = require("./criticalNotificationTypes");

setGlobalOptions({ maxInstances: 10 });
admin.initializeApp();

const CRITICAL_PUSH_TYPE_SET = new Set(CRITICAL_PUSH_TYPES);

/**
 * Triggered when a new document is added to the "notifications" collection.
 * This function fetches the recipient's FCM token from their user document
 * and sends a push notification using Firebase Cloud Messaging.
 */
exports.sendPushNotification = onDocumentCreated("notifications/{notificationId}", async (event) => {
    const snap = event.data;
    if (!snap) return;

    const notificationData = snap.data();
    const toUserId = notificationData.toUserId;
    const type = notificationData.type || "unknown";

    if (!CRITICAL_PUSH_TYPE_SET.has(type)) {
        console.log(`Skipping non-critical notification type for push: ${type}`);
        return;
    }

    if (!toUserId) {
        console.log("No recipient user ID (toUserId) found in notification.");
        return;
    }

    try {
        // Fetch recipient's user document to get FCM tokens
        const userDoc = await admin.firestore().collection("users").doc(toUserId).get();
        if (!userDoc.exists) {
            console.log(`Recipient user profile (${toUserId}) not found.`);
            return;
        }

        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens;

        if (!fcmTokens || !Array.isArray(fcmTokens) || fcmTokens.length === 0) {
            console.log(`No active FCM tokens found for user ${toUserId}. Notification unhandled by FCM.`);
            return;
        }

        console.log(`Found ${fcmTokens.length} tokens for user ${toUserId}. Sending FCM...`);

        // Prepare the payload
        const payload = {
            notification: {
                title: type === "partner_request" ? "New Partner Request" : "New Notification",
                body: notificationData.message || "You have a new message.",
            },
            data: {
                type,
                fromUserId: notificationData.fromUserId || "",
                notificationId: snap.id,
                click_action: "FLUTTER_NOTIFICATION_CLICK" // Optional: useful for cross-platform
            }
        };

        // Send to all registered devices for this user
        const response = await admin.messaging().sendEachForMulticast({
            tokens: fcmTokens,
            notification: payload.notification,
            data: payload.data
        });

        console.log(`Successfully sent ${response.successCount} messages; Failed ${response.failureCount}.`);

        // Optional: Clean up stale tokens if they failed with specific error codes
        if (response.failureCount > 0) {
            const tokensToRemove = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errCode = resp.error?.code;
                    if (errCode === 'messaging/invalid-registration-token' ||
                        errCode === 'messaging/registration-token-not-registered') {
                        tokensToRemove.push(fcmTokens[idx]);
                    }
                }
            });

            if (tokensToRemove.length > 0) {
                await admin.firestore().collection("users").doc(toUserId).update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
                });
                console.log(`Removed ${tokensToRemove.length} invalid tokens.`);
            }
        }

    } catch (error) {
        console.error("Error sending push notification:", error);
    }
});
