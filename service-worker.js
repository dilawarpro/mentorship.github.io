const CACHE_NAME = "mentorship-cache-v1";
const urlsToCache = [
  "/",
  "index.html",
  "appointment.html",
  "2-months-mentorship.html",
  "champions-mentorship.html",
  "refund-policy.html",
  "404.html",
  "styles.css",
  "scripts.js",
  "dilawarmentorship.jpeg",
  "/offline.html"
];

// Install the service worker and cache all specified files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(error => {
        console.error("Failed to cache resources:", error);
      });
    })
  );
  self.skipWaiting();
});

// Fetch resources with Cache First, Network Fallback strategy
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    // Ignore non-GET requests
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Serve from cache if available
      }
      return fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse; // Do not cache non-200 responses or cross-origin requests
          }
          // Clone and cache the network response
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache).catch(error => {
              console.warn("Failed to cache request:", event.request.url, error);
            });
          });
          return networkResponse;
        })
        .catch(() => {
          // Serve offline.html for navigation requests when offline
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        });
    })
  );
});

// Update the service worker and remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});
