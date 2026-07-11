import { useEffect } from 'react';
import { ensurePushSubscription } from '@/lib/pushService';

export default function PushNotificationManager() {
  useEffect(() => {
    // Always attempt to ensure a push subscription exists.
    // ensurePushSubscription() handles permission requests internally.
    ensurePushSubscription();
  }, []);

  return null;
}