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
      console.log("[Service Worker] Caching all resources");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch resources from the cache or network with fallback logic
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if found, otherwise fetch from network
      return (
        response ||
        fetch(event.request)
          .then(networkResponse => {
            // Cache the new resource for future offline use
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            // Fallback for offline usage (e.g., return a default offline page)
            if (event.request.mode === "navigate") {
              return caches.match("/404.html");
            }
          })
      );
    })
  );
});

// Update the service worker and remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});