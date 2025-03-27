const CACHE_VERSION = "v1";
const STATIC_CACHE = `mentorship-static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mentorship-dynamic-cache-${CACHE_VERSION}`;
const MAX_DYNAMIC_CACHE_ITEMS = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/appointment.html",
  "/2-months-mentorship.html",
  "/champions-mentorship.html",
  "/refund-policy.html",
  "/404.html",
  "/styles.css",
  "/scripts.js",
  "/dilawarmentorship.jpeg"
];

// Helper function to check if a request should be cached
function shouldCache(request) {
  const url = new URL(request.url);
  // Skip non-GET requests and requests with query parameters
  if (request.method !== 'GET' || url.search) return false;
  
  // Check content type
  const contentType = request.headers.get('content-type');
  if (!contentType) return true;
  
  // Cache only specific content types
  return contentType.includes('text/html') ||
         contentType.includes('text/css') ||
         contentType.includes('text/javascript') ||
         contentType.includes('image/') ||
         contentType.includes('application/json');
}

// Helper function to manage dynamic cache size
async function manageDynamicCacheSize(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_DYNAMIC_CACHE_ITEMS) {
    await Promise.all(
      keys.slice(0, keys.length - MAX_DYNAMIC_CACHE_ITEMS)
        .map(key => cache.delete(key))
    );
  }
}

// Helper function to fetch with retry
async function fetchWithRetry(request, retries = MAX_RETRIES) {
  try {
    return await fetch(request);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(request, retries - 1);
    }
    throw error;
  }
}

// Install event - cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(DYNAMIC_CACHE),
      self.skipWaiting()
    ])
  );
  console.log('Service Worker installed successfully');
});

// Activate event - clean up old caches and claim clients
self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              (cacheName.startsWith('mentorship-static-cache-') || 
               cacheName.startsWith('mentorship-dynamic-cache-')) &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      self.clients.claim()
    ])
  );
  console.log('Service Worker activated and controlling the page');
});

// Fetch event - implement Cache First, Network Fallback strategy for offline support
self.addEventListener("fetch", event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      // Try cache first
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        // If not in cache, try network
        const networkResponse = await fetchWithRetry(event.request);
        
        // Cache successful responses if they should be cached
        if (networkResponse.ok && shouldCache(event.request)) {
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(event.request, networkResponse.clone());
          await manageDynamicCacheSize(cache);
        }
        
        return networkResponse;
      } catch (error) {
        console.error('Network request failed:', error);
        
        // If network fails and it's a navigation request, return offline page
        if (event.request.mode === 'navigate' ||
            (event.request.method === 'GET' && 
             event.request.headers.get('accept')?.includes('text/html'))) {
          return caches.match('/404.html') || caches.match('/index.html');
        }
        
        // For other requests, return a simple error response
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});

// Handle background sync for offline form submissions
self.addEventListener("sync", event => {
  if (event.tag === "sync-forms") {
    event.waitUntil(
      (async () => {
        try {
          // Get all pending form submissions from IndexedDB
          // This is a placeholder - you would need to implement IndexedDB storage
          const pendingSubmissions = await getPendingSubmissions();
          
          // Try to send each pending submission
          for (const submission of pendingSubmissions) {
            await fetch(submission.url, {
              method: submission.method,
              headers: submission.headers,
              body: submission.body
            });
            
            // If successful, remove from pending queue
            await removePendingSubmission(submission.id);
          }
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      })()
    );
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Mentorship Program',
    icon: '/dilawarmentorship.jpeg',
    badge: '/dilawarmentorship.jpeg',
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Mentorship Program Notification',
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(windowClients => {
        const url = event.notification.data.url;
        
        // Check if there is already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Helper function placeholder for getting pending form submissions
// You would need to implement this with IndexedDB
async function getPendingSubmissions() {
  // Placeholder - implement with IndexedDB
  return [];
}

// Helper function placeholder for removing a pending submission
async function removePendingSubmission(id) {
  // Placeholder - implement with IndexedDB
}

// Handle online/offline state changes
self.addEventListener("online", () => {
  self.registration.sync.register('sync-forms');
  
  // Notify clients that we're back online
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'ONLINE_STATUS', status: true });
    });
  });
});

self.addEventListener("offline", () => {
  // Notify clients that we're offline
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'ONLINE_STATUS', status: false });
    });
  });
});