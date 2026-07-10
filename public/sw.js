self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = JSON.parse(event.data.text());
  } catch (e) {
    data = { title: '🎣 Fishing Time!', body: event.data ? event.data.text() : 'Time to fish!' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || '🎣 Fishing Time!', {
      body: data.body || '',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'fishing-alarm',
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
