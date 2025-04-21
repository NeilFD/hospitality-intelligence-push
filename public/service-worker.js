
self.addEventListener('push', function(event) {
  if (event.data) {
    const notification = event.data.json();
    const options = {
      body: notification.body,
      icon: '/lovable-uploads/867c4809-f55f-4880-aa49-e12c12c65af6.png',
      badge: '/lovable-uploads/867c4809-f55f-4880-aa49-e12c12c65af6.png',
      data: notification.data
    };

    event.waitUntil(
      self.registration.showNotification(notification.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
