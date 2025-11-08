# Push Notifications & Alarms Setup Guide

This guide explains how to enable push notifications and background alarms in the IPTV Dashboard.

## Features

✅ **Push Notifications** - Receive notifications even when the app is closed  
✅ **Background Alarms** - Get notified when task due dates arrive  
✅ **Service Worker** - Handles notifications in the background  
✅ **PWA Support** - Install as a Progressive Web App  

## Setup Instructions

### 1. Browser Permissions

The app will automatically request notification permissions when you first visit the tasks page. You need to:

1. **Allow notifications** when prompted by your browser
2. If you denied permissions, follow these steps:

   **Chrome/Edge:**
   - Click the lock icon (🔒) in the address bar
   - Click "Site settings"
   - Find "Notifications" and set it to "Allow"

   **Firefox:**
   - Click the lock icon in the address bar
   - Click "Permissions"
   - Find "Notifications" and click "Allow"

   **Safari:**
   - Safari → Preferences → Websites → Notifications
   - Find your site and set it to "Allow"

### 2. HTTPS Requirement

⚠️ **Important:** Service workers and push notifications only work over HTTPS (or localhost for development).

- For production, ensure your site is served over HTTPS
- For development, `localhost` works automatically

### 3. Testing Notifications

1. Navigate to `/dashboard/tasks`
2. Check if the notification permission banner shows "Notifications are enabled"
3. Create a task with a due date/time
4. The alarm will trigger when the due date/time arrives, even if the app is closed

### 4. How It Works

#### Service Worker
- Registered automatically when the app loads
- Runs in the background even when the app is closed
- Checks for alarms every minute
- Triggers notifications when alarm times are reached

#### Alarms
- Stored in browser IndexedDB
- Checked every minute by the service worker
- Notifications are sent when the due date/time arrives
- Prevents duplicate notifications (only notifies once per alarm)

#### Push Notifications (Future)
- Requires a backend push service
- Uses Web Push Protocol
- Requires VAPID keys for authentication

## Troubleshooting

### Notifications Not Working?

1. **Check Permissions:**
   - Open browser DevTools (F12)
   - Go to Application tab → Notifications
   - Ensure permission is "Allow"

2. **Check Service Worker:**
   - Open DevTools → Application tab → Service Workers
   - Verify service worker is registered and active
   - Check for any errors

3. **Check Console:**
   - Open DevTools Console
   - Look for any errors related to notifications or service worker

4. **Browser Compatibility:**
   - Chrome/Edge: Full support ✅
   - Firefox: Full support ✅
   - Safari: Limited support (iOS 16.4+)
   - Opera: Full support ✅

### Alarms Not Triggering?

1. **Check Time Zone:**
   - Ensure your system time is correct
   - Alarms use system time, not UTC

2. **Check Service Worker:**
   - Service worker must be active
   - Browser must not be in "Do Not Disturb" mode

3. **Check IndexedDB:**
   - Open DevTools → Application → IndexedDB
   - Verify alarms are stored in `IPTVDashboardDB` → `alarms`

### Background Sync Not Working?

- Some browsers require the tab to be open for background sync
- Service worker checks alarms every minute automatically
- This works even when the app is closed

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### VAPID Keys (for Push Notifications)

To enable server-side push notifications, you need VAPID keys:

1. Generate VAPID keys using a tool like [web-push](https://github.com/web-push-libs/web-push):
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   ```

2. Add the public key to your `.env.local` file
3. Use the private key in your backend push service

## Security Notes

- Service workers only work over HTTPS (or localhost)
- Notifications require explicit user permission
- All alarm data is stored locally in IndexedDB
- No alarm data is sent to external servers

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Notifications | ✅ | ✅ | ✅ (iOS 16.4+) | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ✅ | ❌ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |

## Next Steps

1. ✅ Enable notifications (already done if you see the permission banner)
2. ✅ Create tasks with due dates
3. ✅ Wait for alarm time - you'll receive a notification!

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify service worker is registered
3. Check notification permissions
4. Ensure HTTPS is enabled (or using localhost)
