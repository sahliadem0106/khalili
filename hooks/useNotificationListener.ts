/**
 * useNotificationListener - Hook to subscribe to real-time notifications
 * Listens for undelivered notifications and shows them as push notifications
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { notificationService } from '../services/NotificationService';

export interface InAppNotification {
    id: string;
    message: string;
    type: string;
    fromUserId: string;
    timestamp: Date;
}

export const useNotificationListener = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<InAppNotification[]>([]);
    const [hasPermission, setHasPermission] = useState(false);

    // Request notification permission on mount
    useEffect(() => {
        const requestPermission = async () => {
            const status = await notificationService.requestPermission();
            setHasPermission(status === 'granted');
        };

        if (notificationService.isSupported()) {
            requestPermission();
        }
    }, []);

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user?.uid) return;

        const unsubscribe = notificationService.subscribeToNotifications(
            user.uid,
            (notification) => {
                // Add to in-app notification list
                setNotifications(prev => [
                    {
                        ...notification,
                        timestamp: new Date()
                    },
                    ...prev.slice(0, 9) // Keep last 10
                ]);
            }
        );

        return unsubscribe;
    }, [user?.uid]);

    // Clear a notification
    const clearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Clear all notifications
    const clearAll = () => {
        setNotifications([]);
    };

    return {
        notifications,
        hasPermission,
        clearNotification,
        clearAll,
        unreadCount: notifications.length
    };
};
