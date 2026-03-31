/// <reference lib="webworker" />

const CACHE_NAME = 'pos-cache-v1';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/?mode=pos',
  '/manifest.json',
  '/offline',
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; }).map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests for cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(function() {
        return new Response(
          JSON.stringify({ error: 'غير متصل بالإنترنت' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // For navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          // Cache successful responses
          if (response.status === 200) {
            var responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(cachedResponse) {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // For other requests - cache first, then network
  event.respondWith(
    caches.match(request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then(function(response) {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, response);
            });
          }
        });
        return cachedResponse;
      }

      return fetch(request).then(function(response) {
        if (response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-invoices') {
    event.waitUntil(syncInvoices());
  }
});

function syncInvoices() {
  // Sync offline invoices when back online
  console.log('Syncing offline invoices...');
}

// Push notifications
self.addEventListener('push', function(event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'نظام نقاط البيع';
  var options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.url,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  );
});
