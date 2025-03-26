const CACHE_NAME = "mentorship-cache-v7"; // Increment cache version
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

// ✅ Install and Cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Force immediate activation
});

// ✅ Fetch and Serve Cached Content
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return; // Ignore non-GET requests

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone()); // Update cache
            return networkResponse;
          });
        })
        .catch(() => {
          // If offline and not cached, show fallback page
          return caches.match(event.request.url.includes(".html") ? "/404.html" : "/");
        });
    })
  );
});

// ✅ Activate and Clear Old Cache
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
  self.clients.claim();
});

// ✅ Keep Service Worker Alive (Prevent Auto Kill)
self.addEventListener("periodicsync", event => {
  if (event.tag === "pwa-keepalive") {
    event.waitUntil(Promise.resolve()); // Keeps the service worker alive
  }
});
