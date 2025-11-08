'use client';

import { useEffect, useState } from 'react';
import { Button, Alert, Box, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import {
  requestNotificationPermission,
  hasNotificationPermission,
  registerServiceWorker,
} from '@/lib/utils/notifications';

export default function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    checkPermission();
    registerSW();
  }, []);

  const checkPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const registerSW = async () => {
    const registration = await registerServiceWorker();
    setIsRegistered(!!registration);
  };

  const handleRequestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    
    if (newPermission === 'granted') {
      // Re-register service worker to ensure it's active
      await registerSW();
    }
  };

  if (permission === 'granted' && isRegistered) {
    return (
      <Alert severity="success" icon={<NotificationsIcon />}>
        Notifications are enabled. You will receive push notifications and alarms.
      </Alert>
    );
  }

  if (permission === 'denied') {
    return (
      <Alert severity="warning" icon={<NotificationsOffIcon />}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Notifications are blocked. Please enable them in your browser settings:
          </Typography>
          <Typography variant="caption" component="div">
            <strong>Chrome/Edge:</strong> Click the lock icon in the address bar → Site settings → Notifications → Allow
            <br />
            <strong>Firefox:</strong> Click the lock icon → Permissions → Notifications → Allow
            <br />
            <strong>Safari:</strong> Safari → Preferences → Websites → Notifications → Allow
          </Typography>
        </Box>
      </Alert>
    );
  }

  return (
    <Alert
      severity="info"
      icon={<NotificationsIcon />}
      action={
        <Button color="inherit" size="small" onClick={handleRequestPermission}>
          Enable
        </Button>
      }
    >
      Enable notifications to receive push notifications and alarm reminders even when the app is closed.
    </Alert>
  );
}
