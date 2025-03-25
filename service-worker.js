const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-cache-${CACHE_VERSION}`;
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

// Helper function to fetch with retry and exponential backoff
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

// Helper function to update static cache
async function updateStaticCache() {
  const newStaticCache = `static-cache-${CACHE_VERSION}-${Date.now()}`;
  await caches.open(newStaticCache).then(cache => cache.addAll(STATIC_ASSETS));
  
  // Clean up old static caches
  const oldCaches = await caches.keys();
  await Promise.all(
    oldCaches
      .filter(key => key.startsWith('static-cache-') && key !== newStaticCache)
      .map(key => caches.delete(key))
  );
  
  return newStaticCache;
}

// Helper function to check if we're offline
async function isOffline() {
  try {
    const response = await fetch('/offline-check.txt', { method: 'HEAD' });
    return !response.ok;
  } catch (error) {
    return true;
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
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              (cacheName.startsWith('static-cache-') || cacheName.startsWith('dynamic-cache-')) &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - implement Network First, Cache Fallback strategy
self.addEventListener("fetch", event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Check if we're offline
        const offline = await isOffline();
        
        if (offline) {
          // If offline, try cache first
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If no cache and it's a navigation request, return offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/404.html');
          }
          
          throw new Error('Offline and no cache available');
        }

        // Online - try network first
        const networkResponse = await fetchWithRetry(event.request);
        
        if (networkResponse.ok && shouldCache(event.request)) {
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(event.request, networkResponse.clone());
          await manageDynamicCacheSize(cache);
        }
        
        return networkResponse;
      } catch (error) {
        console.error('Request failed:', error);
        
        // Try cache as fallback
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If both network and cache fail, return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/404.html');
        }
      }
    })()
  );
});

// Handle background sync
self.addEventListener("sync", event => {
  if (event.tag === "sync-cache") {
    event.waitUntil(
      (async () => {
        try {
          await updateStaticCache();
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.addAll(STATIC_ASSETS);
          await manageDynamicCacheSize(cache);
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      })()
    );
  }
});

// Handle periodic background sync
self.addEventListener("periodicsync", event => {
  if (event.tag === "update-cache") {
    event.waitUntil(
      (async () => {
        try {
          await updateStaticCache();
          await caches.open(DYNAMIC_CACHE);
        } catch (error) {
          console.error('Periodic sync failed:', error);
        }
      })()
    );
  }
});

// Handle online/offline state changes
self.addEventListener("online", () => {
  (async () => {
    try {
      await updateStaticCache();
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
      await manageDynamicCacheSize(cache);
      
      // Notify clients that we're back online
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'ONLINE_STATUS', status: true });
      });
    } catch (error) {
      console.error('Online sync failed:', error);
    }
  })();
});

// Handle offline state
self.addEventListener("offline", () => {
  (async () => {
    // Notify clients that we're offline
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'ONLINE_STATUS', status: false });
    });
  })();
});

// Handle service worker messages
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
