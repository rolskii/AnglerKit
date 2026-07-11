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
    let result;
    try {
      result = await Notification.requestPermission();
    } catch (e) {
      return { ok: false, error: `Browser rejected the permission request: ${e.message}` };
    }
    if (result === 'denied') {
      return { ok: false, error: 'Notifications were blocked (either by you or the browser). To fix: click the lock/settings icon in your browser address bar, find Notifications, and set it to "Allow" or "Ask", then reload and try again.', permission: 'denied' };
    }
    if (result === 'default') {
      return { ok: false, error: 'The permission prompt was dismissed without a choice. Click "Enable Notifications" again, and this time click "Allow" on the popup.', permission: 'default' };
    }
  }
  if (Notification.permission !== 'granted') {
    return { ok: false, error: `Notification permission is "${Notification.permission}". Reset it in your browser settings: click the lock icon in the address bar → Site Settings → Notifications → Allow.`, permission: Notification.permission };
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

    if (!subscription || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      // Stale subscription without encryption keys — do a full reset:
      // unsubscribe, unregister the service worker, re-register, wait for
      // activation, then re-subscribe
      console.warn('Subscription missing keys, doing full SW reset…');
      if (subscription) { try { await subscription.unsubscribe(); } catch (_) {} }
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) { try { await reg.unregister(); } catch (_) {} }
      await new Promise(r => setTimeout(r, 500));
      const freshReg = await navigator.serviceWorker.register('/sw.js');
      // Wait for the new SW to be fully activated before subscribing
      if (freshReg.active) {
        // already active — good
      } else if (freshReg.installing || freshReg.waiting) {
        await new Promise((resolve) => {
          const sw = freshReg.installing || freshReg.waiting;
          const checkState = () => {
            if (sw.state === 'activated') resolve();
            else if (sw.state === 'redundant') resolve();
          };
          sw.addEventListener('statechange', checkState);
          checkState();
        });
      } else {
        await navigator.serviceWorker.ready;
      }
      subscription = await freshReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.info('Subscription after reset:', JSON.stringify({
        endpoint: subscription?.endpoint,
        hasKeys: !!(subscription?.keys?.p256dh && subscription?.keys?.auth),
      }));
    }

    if (!subscription || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      const ua = navigator.userAgent || '';
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      return {
        ok: false,
        error: isSafari
          ? 'Safari did not return a valid push subscription. Try: 1) Quit Safari completely, 2) Reopen and navigate to this page, 3) Click Enable again. If it still fails, try Chrome or Edge.'
          : 'The browser returned an incomplete push subscription. Try reloading the page, or use a different browser (Chrome or Edge recommended).',
      };
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