/// <reference lib="webworker" />

// ============================================================================
// PWA Service Worker - POS System
// Version: 3.0.0
// ============================================================================

// Cache Names for different strategies
const CACHE_NAMES = {
  STATIC: 'pos-static-v3',
  DYNAMIC: 'pos-dynamic-v3',
  API: 'pos-api-v3',
  IMAGES: 'pos-images-v3',
  FONTS: 'pos-fonts-v3',
};

// Static assets to cache on install (Cache First)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline/',
];

// Assets that should use Cache First strategy
const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css|woff2?|ttf|eot)$/,
  /\/_next\/static\//,
  /\/icons\//,
  /\/uploads\//,
];

// Assets that should use Network First strategy
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
];

// Assets that should use Stale While Revalidate
const STALE_WHILE_REVALIDATE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
];

// Maximum items in dynamic cache
const MAX_DYNAMIC_CACHE_SIZE = 100;

// ============================================================================
// Install Event - Cache Static Assets
// ============================================================================
self.addEventListener('install', function(event) {
  console.log('[SW] Installing Service Worker v3...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAMES.STATIC).then(function(cache) {
        console.log('[SW] Caching static assets');
        return Promise.allSettled(
          STATIC_ASSETS.map(function(url) {
            return cache.add(url).catch(function(err) {
              console.warn('[SW] Failed to cache:', url, err);
            });
          })
        );
      }),
      // Pre-cache offline page
      caches.open(CACHE_NAMES.DYNAMIC).then(function(cache) {
        return cache.add('/offline/').catch(function() {
          console.warn('[SW] Offline page not available');
        });
      }),
    ])
  );
  
  // Force activation
  self.skipWaiting();
});

// ============================================================================
// Activate Event - Clean Old Caches
// ============================================================================
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating Service Worker v3...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(function(keys) {
        return Promise.all(
          keys
            .filter(function(key) {
              return !Object.values(CACHE_NAMES).includes(key);
            })
            .map(function(key) {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

// ============================================================================
// Helper Functions
// ============================================================================

// Check if URL matches any pattern
function matchesPattern(url, patterns) {
  return patterns.some(function(pattern) {
    return pattern.test(url);
  });
}

// Limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Delete oldest entries
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
    console.log('[SW] Cleaned', deleteCount, 'items from', cacheName);
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Cache First: Serving from cache:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Cache First: Fetching from network:', request.url);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First: Network failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy
async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  const timeout = timeoutMs || 5000;
  
  console.log('[SW] Network First: Trying network:', request.url);
  
  try {
    // Create timeout promise
    const timeoutPromise = new Promise(function(_, reject) {
      setTimeout(function() {
        reject(new Error('Network timeout'));
      }, timeout);
    });
    
    // Race between network and timeout
    const networkResponse = await Promise.race([
      fetch(request),
      timeoutPromise,
    ]);
    
    // Cache successful response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('[SW] Network First: Cached response');
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network First: Network failed, trying cache');
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'غير متصل بالإنترنت',
        offline: true,
        message: 'البيانات غير متوفرة حالياً'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network fetch in background
  const networkFetch = fetch(request).then(function(response) {
    if (response.ok) {
      cache.put(request, response.clone());
      console.log('[SW] Stale While Revalidate: Updated cache');
    }
    return response;
  }).catch(function(error) {
    console.warn('[SW] Stale While Revalidate: Network failed:', error);
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    console.log('[SW] Stale While Revalidate: Serving from cache');
    return cachedResponse;
  }
  
  // Otherwise wait for network
  console.log('[SW] Stale While Revalidate: Waiting for network');
  return networkFetch || new Response('Offline', { status: 503 });
}

// ============================================================================
// Fetch Event - Route Requests
// ============================================================================
self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests (handled by background sync)
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Route based on request type
  const urlString = url.toString();
  
  // API Requests - Network First
  if (matchesPattern(urlString, NETWORK_FIRST_PATTERNS)) {
    event.respondWith(networkFirst(request, CACHE_NAMES.API, 10000));
    return;
  }
  
  // Static Assets - Cache First
  if (matchesPattern(urlString, CACHE_FIRST_PATTERNS)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.STATIC));
    return;
  }
  
  // Images - Stale While Revalidate
  if (matchesPattern(urlString, STALE_WHILE_REVALIDATE_PATTERNS)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.IMAGES));
    return;
  }
  
  // Navigation Requests - Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, CACHE_NAMES.DYNAMIC, 5000)
        .then(function(response) {
          if (response.status === 503) {
            return caches.match('/offline/') || response;
          }
          return response;
        })
    );
    return;
  }
  
  // Default - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.DYNAMIC));
});

// ============================================================================
// Background Sync - Offline Invoice Sync
// ============================================================================
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-invoices') {
    event.waitUntil(syncInvoices());
  }
  
  if (event.tag === 'sync-products') {
    event.waitUntil(syncProducts());
  }
  
  if (event.tag === 'sync-customers') {
    event.waitUntil(syncCustomers());
  }
});

// Sync offline invoices
async function syncInvoices() {
  console.log('[SW] Syncing offline invoices...');
  
  try {
    // Get pending invoices from IndexedDB
    const pendingInvoices = await getPendingData('pending-invoices');
    
    if (!pendingInvoices || pendingInvoices.length === 0) {
      console.log('[SW] No pending invoices to sync');
      return;
    }
    
    for (const invoice of pendingInvoices) {
      try {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoice.data),
        });
        
        if (response.ok) {
          await removePendingData('pending-invoices', invoice.id);
          console.log('[SW] Invoice synced successfully:', invoice.id);
          
          // Notify clients
          await notifyClients({
            type: 'SYNC_SUCCESS',
            message: 'تم مزامنة الفاتورة بنجاح',
            invoiceId: invoice.id,
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync invoice:', invoice.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync invoices error:', error);
  }
}

// Sync offline products changes
async function syncProducts() {
  console.log('[SW] Syncing offline products...');
  // Implementation for product sync
}

// Sync offline customers changes
async function syncCustomers() {
  console.log('[SW] Syncing offline customers...');
  // Implementation for customer sync
}

// ============================================================================
// IndexedDB Helpers
// ============================================================================
function openDatabase() {
  return new Promise(function(resolve, reject) {
    const request = indexedDB.open('pos-offline-db', 1);
    
    request.onerror = function() {
      reject(request.error);
    };
    
    request.onsuccess = function() {
      resolve(request.result);
    };
    
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      
      // Create stores for offline data
      if (!db.objectStoreNames.contains('pending-invoices')) {
        db.createObjectStore('pending-invoices', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-products')) {
        db.createObjectStore('pending-products', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-customers')) {
        db.createObjectStore('pending-customers', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached-products')) {
        db.createObjectStore('cached-products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached-customers')) {
        db.createObjectStore('cached-customers', { keyPath: 'id' });
      }
    };
  });
}

async function getPendingData(storeName) {
  const db = await openDatabase();
  return new Promise(function(resolve, reject) {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = function() {
      resolve(request.result);
    };
    request.onerror = function() {
      reject(request.error);
    };
  });
}

async function removePendingData(storeName, id) {
  const db = await openDatabase();
  return new Promise(function(resolve, reject) {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = function() {
      resolve();
    };
    request.onerror = function() {
      reject(request.error);
    };
  });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(function(client) {
    client.postMessage(message);
  });
}

// ============================================================================
// Push Notifications
// ============================================================================
self.addEventListener('push', function(event) {
  console.log('[SW] Push event received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'نظام نقاط البيع';
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
    dir: 'rtl',
    lang: 'ar',
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// ============================================================================
// Message Handling - Communication with Main App
// ============================================================================
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_PRODUCTS':
      cacheProducts(payload);
      break;
      
    case 'CACHE_CUSTOMERS':
      cacheCustomers(payload);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(function(status) {
        event.ports[0].postMessage(status);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(function() {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

// Cache products for offline use
async function cacheProducts(products) {
  const db = await openDatabase();
  return new Promise(function(resolve, reject) {
    const transaction = db.transaction('cached-products', 'readwrite');
    const store = transaction.objectStore('cached-products');
    
    products.forEach(function(product) {
      store.put(product);
    });
    
    transaction.oncomplete = function() {
      console.log('[SW] Products cached for offline use');
      resolve();
    };
    transaction.onerror = function() {
      reject(transaction.error);
    };
  });
}

// Cache customers for offline use
async function cacheCustomers(customers) {
  const db = await openDatabase();
  return new Promise(function(resolve, reject) {
    const transaction = db.transaction('cached-customers', 'readwrite');
    const store = transaction.objectStore('cached-customers');
    
    customers.forEach(function(customer) {
      store.put(customer);
    });
    
    transaction.oncomplete = function() {
      console.log('[SW] Customers cached for offline use');
      resolve();
    };
    transaction.onerror = function() {
      reject(transaction.error);
    };
  });
}

// Get cache status
async function getCacheStatus() {
  const cacheNames = Object.values(CACHE_NAMES);
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  
  return status;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(function(name) {
    return caches.delete(name);
  }));
  console.log('[SW] All caches cleared');
}

// ============================================================================
// Periodic Background Sync (if supported)
// ============================================================================
self.addEventListener('periodicsync', function(event) {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncAllData());
  }
});

async function syncAllData() {
  console.log('[SW] Syncing all data...');
  await syncInvoices();
  await syncProducts();
  await syncCustomers();
}

console.log('[SW] Service Worker loaded - v3');
