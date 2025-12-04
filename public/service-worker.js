// Service Worker for Push Notifications and Background Alarms

const CACHE_NAME = 'iptv-dashboard-v1';
const RUNTIME_CACHE = 'iptv-runtime-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event);

  let notificationData = {
    title: 'IPTV Dashboard',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data || {},
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      actions: notificationData.actions || [],
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle background sync for alarms
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'check-alarms') {
    event.waitUntil(checkAlarms());
  }
});

// Check and trigger alarms
async function checkAlarms() {
  try {
    // Get all alarms from IndexedDB
    const alarms = await getAlarmsFromStorage();
    const now = new Date();

    for (const alarm of alarms) {
      const alarmTime = new Date(alarm.dueDate);
      
      // Check if alarm time has passed (within 1 minute tolerance)
      if (alarmTime <= now && alarmTime > new Date(now.getTime() - 60000)) {
        // Check if we haven't already notified for this alarm
        const lastNotified = alarm.lastNotified 
          ? new Date(alarm.lastNotified)
          : null;

        if (!lastNotified || lastNotified < alarmTime) {
          // Trigger notification
          await triggerAlarmNotification(alarm);
          
          // Update last notified time
          await updateAlarmNotificationTime(alarm.id);
        }
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error checking alarms:', error);
  }
}

// Get alarms from IndexedDB
function getAlarmsFromStorage() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IPTVDashboardDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['alarms'], 'readonly');
      const store = transaction.objectStore('alarms');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('alarms')) {
        db.createObjectStore('alarms', { keyPath: 'id' });
      }
    };
  });
}

// Trigger alarm notification
function triggerAlarmNotification(alarm) {
  return self.registration.showNotification(alarm.title || 'Task Reminder', {
    body: alarm.description || `Task "${alarm.title}" is due now!`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `alarm-${alarm.id}`,
    data: {
      url: `/dashboard/tasks`,
      alarmId: alarm.id,
    },
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Task',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  });
}

// Update alarm notification time
function updateAlarmNotificationTime(alarmId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IPTVDashboardDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['alarms'], 'readwrite');
      const store = transaction.objectStore('alarms');
      const getRequest = store.get(alarmId);

      getRequest.onsuccess = () => {
        const alarm = getRequest.result;
        if (alarm) {
          alarm.lastNotified = new Date().toISOString();
          const updateRequest = store.put(alarm);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

// Periodic background alarm check (every minute when active)
setInterval(() => {
  checkAlarms();
}, 60000); // Check every minute

// Listen for messages from the app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CHECK_ALARMS') {
    checkAlarms();
  }

  if (event.data && event.data.type === 'REGISTER_ALARM') {
    registerAlarm(event.data.alarm);
  }
});

// Register alarm for background notification
function registerAlarm(alarm) {
  // Store alarm in IndexedDB
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IPTVDashboardDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['alarms'], 'readwrite');
      const store = transaction.objectStore('alarms');
      const putRequest = store.put({
        id: alarm.id,
        title: alarm.title,
        description: alarm.description,
        dueDate: alarm.dueDate,
        lastNotified: null,
      });

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('alarms')) {
        db.createObjectStore('alarms', { keyPath: 'id' });
      }
    };
  });
}
