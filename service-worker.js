const CACHE_NAME = "mentorship-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/appointment.html",
  "/2-months-mentorship.html",
  "/champions-mentorship.html",
  "/refund-policy.html",
  "/404.html",
  "/styles.css", // Add your CSS file paths
  "/scripts.js", // Add your JS file paths
  "/dilawarmentorship.jpeg" // Add your image paths
];

// Install the service worker and cache all specified files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch resources with Network First, Cache Fallback strategy
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response before caching it
        const responseToCache = response.clone();
        
        // Update the cache with the new response
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // If network request fails, try to get from cache
        return caches.match(event.request);
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

// Handle periodic cache updates
self.addEventListener("periodicsync", event => {
  if (event.tag === "update-cache") {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(urlsToCache);
      })
    );
  }
});

// Handle online/offline state changes
self.addEventListener("online", () => {
  // Update cache when coming back online
  caches.open(CACHE_NAME).then(cache => {
    return cache.addAll(urlsToCache);
  });
});
