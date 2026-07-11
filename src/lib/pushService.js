import { base44 } from '@/api/base44Client';

const VAPID_PUBLIC_KEY = 'BFsm3txeTi8rhAzQUu39fke-rJS2AgfzGnPiVdzTFi8pNlVzQxt5nPPK2rTOXIO9OtKlkKdJLm4c39efLT6RwxY';

const parseTimeToMinutes = (timeStr) => {
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export async function ensurePushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, error: 'Push notifications are not supported by this browser.' };
  }

  // Request permission if not yet granted
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, error: 'Permission was not granted. The browser may have silently blocked the prompt — try resetting site permissions in your browser settings.' };
    }
  }
  if (Notification.permission !== 'granted') {
    return { ok: false, error: 'Notification permission was previously denied. Reset it in your browser settings: Site Settings → Notifications → Allow.' };
  }

  try {
    // Register the service worker and wait for it to be ready
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.info('New push subscription created.');
    }

    // Register the subscription with the backend
    const res = await base44.functions.invoke('registerPush', {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
    console.info('Push subscription registered:', res.data);
    return { ok: true };
  } catch (e) {
    console.error('Push subscription failed:', e);
    return { ok: false, error: e.message || 'Unknown error during push subscription.' };
  }
}

export async function syncAlarmToServer(date, time, offset, location) {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const targetMinutes = parseTimeToMinutes(time);
    if (targetMinutes == null) return;
    const fireMinutes = targetMinutes - offset;
    const fireDate = new Date(year, month - 1, day);
    fireDate.setHours(Math.floor(fireMinutes / 60), fireMinutes % 60, 0, 0);

    await base44.entities.FishingAlarm.create({
      date,
      time,
      offset,
      fire_time: fireDate.toISOString(),
      location,
      fired: false,
      enabled: true,
    });
  } catch (e) {
    console.error('Failed to sync alarm to server:', e);
  }
}

export async function removeAlarmFromServer(date, time) {
  try {
    const matching = await base44.entities.FishingAlarm.filter({ date, time });
    for (const m of matching) {
      await base44.entities.FishingAlarm.delete(m.id);
    }
  } catch (e) {
    console.error('Failed to remove alarm from server:', e);
  }
}