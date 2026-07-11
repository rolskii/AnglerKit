import { useEffect } from 'react';
import { ensurePushSubscription } from '@/lib/pushService';

export default function PushNotificationManager() {
  useEffect(() => {
    // Only create/renew the push subscription if permission is already granted.
    // Permission must be requested via user gesture (Settings → Enable Notifications).
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      ensurePushSubscription();
    }
  }, []);

  return null;
}