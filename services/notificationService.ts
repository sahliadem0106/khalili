
import { Prayer } from '../types';

export const notificationService = {
  
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  sendNotification: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png', // Assuming PWA icon exists or standard fallback
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
      } as any);
    }
  },

  checkAndNotify: (prayers: Prayer[]) => {
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    prayers.forEach(prayer => {
      if (prayer.time === currentTime) {
        // Check if we already notified for this time (simple debounce in memory)
        const key = `notified_${prayer.id}_${new Date().toDateString()}`;
        if (!sessionStorage.getItem(key)) {
          notificationService.sendNotification(
            `Time for ${prayer.name}`,
            `It is now ${prayer.time}. Hayya 'alas-Salah.`
          );
          sessionStorage.setItem(key, 'true');
        }
      }
    });
  }
};
