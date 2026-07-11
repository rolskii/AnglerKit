// Service Worker for Angler's Log — handles push notifications for alarms
// This allows alarms to fire even when the app is closed

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '🎣 Fishing Time!', body: 'Your feeding window is starting!' };
  try {
    if (event.data) data = JSON.parse(event.data.text());
  } catch (e) {
    try { data.body = event.data ? event.data.text() : data.body; } catch (e2) {}
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [300, 150, 300, 150, 300, 150, 400],
    requireInteraction: true,
    tag: 'fishing-alarm',
    renotify: true,
    data: { url: '/' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Re-subscribe if the push subscription expires or changes
// Note: The actual re-registration with the backend happens on next app open
// via ensurePushSubscription() in pushService.js — this just re-subscribes locally.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
    })
  );
});
