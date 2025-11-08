/**
 * Notification and Push Notification Utilities
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Check if notification permission is granted
 */
export function hasNotificationPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Show a local notification
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
  if (!hasNotificationPermission()) {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/logo/android-chrome-192x192.png',
      badge: options.badge || '/logo/android-chrome-192x192.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction,
      vibrate: options.vibrate,
      actions: options.actions,
    });
  } else {
    // Fallback to regular notification API
    new Notification(options.title, {
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      data: options.data,
    });
  }
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[Service Worker] Registered successfully:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Service Worker] New content available');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[Service Worker] Registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications (requires backend push service)
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  publicKey: string
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    console.log('[Push] Subscribed:', subscription.endpoint);
    return subscription;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return null;
  }
}

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register alarm for background notification
 */
export async function registerAlarm(alarm: {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported, alarm will not work in background');
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  // Send message to service worker to register alarm
  if (registration.active) {
    registration.active.postMessage({
      type: 'REGISTER_ALARM',
      alarm: {
        id: alarm.id,
        title: alarm.title,
        description: alarm.description,
        dueDate: alarm.dueDate,
      },
    });
  }

  // Also trigger immediate check if service worker is ready
  if (registration.active) {
    registration.active.postMessage({
      type: 'CHECK_ALARMS',
    });
  }
}

/**
 * Check if browser supports background sync
 */
export function supportsBackgroundSync(): boolean {
  return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if (!supportsBackgroundSync()) {
    console.warn('Background sync not supported');
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  try {
    await registration.sync.register(tag);
    console.log('[Background Sync] Registered:', tag);
  } catch (error) {
    console.error('[Background Sync] Registration failed:', error);
  }
}
