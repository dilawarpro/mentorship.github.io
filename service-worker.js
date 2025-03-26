const CACHE_NAME = "mentorship-cache-v1";
const urlsToCache = [
  "/",
  "index.html",
  "appointment.html",
  "2-months-mentorship.html",
  "champions-mentorship.html",
  "refund-policy.html",
  "manifest.json",
  "bootstrap.min.css",
  "404.html",
  "styles.css", // Add your CSS file paths
  "scripts.js", // Add your JS file paths
  "dilawarmentorship.jpeg" // Add your image paths
];

// Install the service worker and cache all specified files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        ...urlsToCache,
        "/offline.html" // Add an explicit offline fallback page
      ]).catch((error) => {
        console.error('Failed to cache resources:', error);
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch resources with Cache First, Network Fallback strategy
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    // Skip caching for non-GET requests
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
            return networkResponse; // Skip caching invalid responses
          }
          // Clone and cache the network response
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache).catch(error => {
              console.warn("Failed to cache response:", error);
            });
          });
          return networkResponse;
        })
        .catch(() => {
          // Serve offline.html for navigation requests when offline
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          // Optionally, return a fallback for other types of requests
        });
    })
  );
});

// Update the service worker and remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      // Remove old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});
