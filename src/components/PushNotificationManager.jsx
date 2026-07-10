import { useEffect } from 'react';
import { ensurePushSubscription } from '@/lib/pushService';

export default function PushNotificationManager() {
  useEffect(() => {
    if (Notification.permission === 'granted') {
      ensurePushSubscription();
    }
  }, []);

  return null;
}