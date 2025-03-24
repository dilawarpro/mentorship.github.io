const CACHE_NAME = "mentorship-cache-v3";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/scripts.js",
  "/dilawarmentorship.jpeg",
  "/offline.html" // Ensure you have an offline fallback page
];

// Install and cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache)
        .then(() => console.log("Files cached successfully"))
        .catch(error => console.error("Cache failed:", error));
    })
  );
});

// Fetch resources from cache or network, with offline fallback
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        console.log("Serving from cache:", event.request.url);
        return response;
      }

      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html");
        }
      });
    })
  );
});

// Activate service worker and delete old caches
self.addEventListener("activate", event => {
  console.log("Service Worker Activated...");

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
})
