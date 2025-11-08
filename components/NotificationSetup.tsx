'use client';

import { useEffect } from 'react';
import { registerServiceWorker, requestNotificationPermission } from '@/lib/utils/notifications';

/**
 * Component to initialize notifications and service worker
 * Should be included in the root layout
 */
export default function NotificationSetup() {
  useEffect(() => {
    const initNotifications = async () => {
      // Register service worker
      await registerServiceWorker();

      // Request notification permission if not already granted
      if ('Notification' in window && Notification.permission === 'default') {
        // Don't auto-request, let user click the button
        // await requestNotificationPermission();
      }
    };

    initNotifications();
  }, []);

  return null; // This component doesn't render anything
}
