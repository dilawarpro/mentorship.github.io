const CACHE_NAME = "mentorship-cache-v5"; // Increment cache version
const urlsToCache = [
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

const MAX_CACHE_ITEMS = 50; // Limit cache size

// Install service worker and cache required assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).catch(err => console.error("Cache error:", err))
  );
  self.skipWaiting(); // Activate new service worker immediately
});

// Fetch resources from cache or network
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return; // Ignore non-GET requests

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(networkResponse => {
          if (!event.request.url.includes("/api/") && event.request.url.startsWith(self.location.origin)) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              cache.keys().then(keys => {
                if (keys.length > MAX_CACHE_ITEMS) cache.delete(keys[0]); // Remove old cache items
              });
              return networkResponse;
            });
          }
          return networkResponse;
        });
    }).catch(() => {
      // Show browser’s default offline page instead of an error
      return fetch(event.request);
    })
  );
});

// Activate service worker and delete old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});
