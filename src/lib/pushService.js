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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
  }
  if (Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await base44.functions.invoke('registerPush', {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
  } catch (e) {}
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
  } catch (e) {}
}

export async function removeAlarmFromServer(date, time) {
  try {
    const matching = await base44.entities.FishingAlarm.filter({ date, time });
    for (const m of matching) {
      await base44.entities.FishingAlarm.delete(m.id);
    }
  } catch (e) {}
}