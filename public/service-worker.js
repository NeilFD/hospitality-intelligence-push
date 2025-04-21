
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  if (event.data) {
    const notification = event.data.json();
    console.log('Notification data:', notification);
    const options = {
      body: notification.body,
      icon: '/lovable-uploads/867c4809-f55f-4880-aa49-e12c12c65af6.png',
      badge: '/lovable-uploads/867c4809-f55f-4880-aa49-e12c12c65af6.png',
      data: notification.data,
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification(notification.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Add a specific event listener to verify service worker installation
self.addEventListener('install', function(event) {
  console.log('Service Worker installed successfully');
  self.skipWaiting();
});

// Add an activate event to take control immediately
self.addEventListener('activate', function(event) {
  console.log('Service Worker activated successfully');
  event.waitUntil(clients.claim());
});

// Listen for messages from the main thread
self.addEventListener('message', function(event) {
  console.log('Service worker received message:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
