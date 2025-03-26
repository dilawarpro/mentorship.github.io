const CACHE_NAME = "mentorship-cache-v6"; // Increment cache version
const urlsToCache = [
  "/",
  "/index.html",
  "/appointment.html",
  "/2-months-mentorship.html",
  "/champions-mentorship.html",
  "/refund-policy.html", // ✅ Make sure this is included
  "/404.html",
  "/styles.css",
  "/scripts.js",
  "/dilawarmentorship.jpeg"
];

// Install and Cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Fetch and Serve Cached Content
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return; // Ignore non-GET requests

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // If offline and no cache, show custom offline page
        return caches.match("/refund-policy.html") || caches.match("/404.html");
      });
    })
  );
});

// Activate and Clear Old Cache
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
