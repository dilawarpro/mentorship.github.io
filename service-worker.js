const CACHE_NAME = "mentorship-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/appointment.html",
  "/2-months-mentorship.html",
  "/champions-mentorship.html",
  "/refund-policy.html",
  "/404.html",
  "/styles.css", // CSS files
  "/scripts.js", // JS files
  "/dilawarmentorship.jpeg" // Images
];

// Install and cache assets
self.addEventListener("install", event => {
  self.skipWaiting(); // Activate service worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => console.error("Caching failed", err));
    })
  );
});

// Activate and remove old cache versions
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ensure service worker takes control immediately
});

// Fetch with Cache-First Strategy
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Serve from cache
      }
      return fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone()); // Update cache
          return networkResponse;
        });
      }).catch(() => caches.match("/offline.html")); // Serve offline page if needed
    })
  );
})
