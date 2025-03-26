const CACHE_NAME = "mentorship-cache-v9"; // Update cache version

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

// ✅ Install and Cache Files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// ✅ Fetch Handler - Cache First, Then Network
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return; // Ignore non-GET requests

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone()); // Cache updated response
          return networkResponse;
        });
      });
    }).catch(() => {
      // If offline and request is for an HTML page, show fallback
      return caches.match(event.request.url.includes(".html") ? "/404.html" : "/");
    })
  );
});

// ✅ Activate - Delete Old Caches
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
})
