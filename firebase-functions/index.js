/**
 * Firebase Cloud Functions for Push Notifications
 * 
 * SETUP:
 * 1. Create a `functions` folder in your Firebase project
 * 2. Run: cd functions && npm init -y
 * 3. Run: npm install firebase-functions firebase-admin
 * 4. Copy this file to functions/index.js
 * 5. Deploy: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggered when a new notification document is created
 * Sends a push notification to the recipient via FCM
 */
exports.sendPushNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notification = snap.data();
        const recipientId = notification.toUserId;

        if (!recipientId) {
            console.log('No recipient ID, skipping...');
            return null;
        }

        try {
            // Get the user's FCM token from Firestore
            const userDoc = await admin.firestore()
                .collection('users')
                .doc(recipientId)
                .get();

            if (!userDoc.exists) {
                console.log('User not found:', recipientId);
                return null;
            }

            const userData = userDoc.data();
            const fcmToken = userData.fcmToken;

            if (!fcmToken) {
                console.log('No FCM token for user:', recipientId);
                return null;
            }

            // Build the notification message
            const message = {
                token: fcmToken,
                notification: {
                    title: getNotificationTitle(notification.type),
                    body: notification.message || 'You have a new notification',
                },
                data: {
                    type: notification.type || 'general',
                    fromUserId: notification.fromUserId || '',
                    notificationId: context.params.notificationId,
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'partner_notifications',
                        icon: 'ic_notification',
                        color: '#10B981', // Emerald color
                    },
                },
            };

            // Send the notification
            const response = await admin.messaging().send(message);
            console.log('Push notification sent:', response);

            // Mark as delivered
            await snap.ref.update({
                pushSent: true,
                pushSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return response;
        } catch (error) {
            console.error('Error sending push notification:', error);

            // If token is invalid, remove it
            if (error.code === 'messaging/registration-token-not-registered') {
                await admin.firestore()
                    .collection('users')
                    .doc(recipientId)
                    .update({ fcmToken: null });
            }

            return null;
        }
    });

/**
 * Triggered when a broadcast is created
 * Sends push notifications to all circle members
 */
exports.sendBroadcastNotifications = functions.firestore
    .document('broadcasts/{broadcastId}')
    .onCreate(async (snap, context) => {
        const broadcast = snap.data();
        const { circleId, fromUserId, message, actionType } = broadcast;

        if (!circleId) {
            console.log('No circle ID, skipping...');
            return null;
        }

        try {
            // Get the circle to find members
            const circleDoc = await admin.firestore()
                .collection('groups')
                .doc(circleId)
                .get();

            if (!circleDoc.exists) {
                console.log('Circle not found:', circleId);
                return null;
            }

            const circle = circleDoc.data();
            const members = circle.members || [];

            // Get sender's name
            const senderDoc = await admin.firestore()
                .collection('users')
                .doc(fromUserId)
                .get();
            const senderName = senderDoc.exists
                ? (senderDoc.data().displayName || 'Someone')
                : 'Someone';

            // Send to all members except sender
            const promises = members
                .filter(memberId => memberId !== fromUserId)
                .map(async (memberId) => {
                    const memberDoc = await admin.firestore()
                        .collection('users')
                        .doc(memberId)
                        .get();

                    if (!memberDoc.exists) return null;

                    const fcmToken = memberDoc.data().fcmToken;
                    if (!fcmToken) return null;

                    const pushMessage = {
                        token: fcmToken,
                        notification: {
                            title: `📢 ${circle.name || 'Circle Broadcast'}`,
                            body: `${senderName}: ${message}`,
                        },
                        data: {
                            type: 'broadcast',
                            circleId,
                            fromUserId,
                            actionType: actionType || 'custom',
                        },
                        android: {
                            priority: 'high',
                            notification: {
                                channelId: 'broadcast_notifications',
                                icon: 'ic_notification',
                                color: '#10B981',
                            },
                        },
                    };

                    return admin.messaging().send(pushMessage);
                });

            const results = await Promise.all(promises);
            console.log(`Broadcast sent to ${results.filter(Boolean).length} members`);

            return results;
        } catch (error) {
            console.error('Error sending broadcast notifications:', error);
            return null;
        }
    });

/**
 * Helper to get notification title based on type
 */
function getNotificationTitle(type) {
    switch (type) {
        case 'adhan_reminder':
            return '🕌 Prayer Reminder';
        case 'reminder':
            return '⏰ Partner Reminder';
        case 'broadcast':
            return '📢 Circle Broadcast';
        case 'connection_request':
            return '👋 New Connection Request';
        case 'request_accepted':
            return '🎉 Request Accepted';
        case 'invite':
            return '✉️ New Invitation';
        default:
            return '🔔 Muslim Daily';
    }
}
