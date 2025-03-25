const CACHE_NAME = "mentorship-cache-v3"; // Update version when making changes
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
  "offline.html" // Ensure this file exists and is accessible
];

// Install and pre-cache assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).catch(err => console.error("Failed to cache files", err))
  );
  self.skipWaiting(); // Activate the new service worker immediately
});

// Fetch strategy with improved cache handling
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return; // Ignore non-GET requests

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(networkResponse => {
          // Cache only static assets (HTML, CSS, JS, images)
          if (!event.request.url.includes("/api/")) { 
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        });
    }).catch(() => {
      // Return offline.html only for HTML requests
      if (event.request.destination === "document") {
        return caches.match("/offline.html");
      }
    })
  );
});

// Activate service worker, remove old caches
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
  self.clients.claim(); // Take control immediately
});
