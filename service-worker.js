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
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install event triggered");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching all specified files");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("[Service Worker] Failed to cache files during install:", error);
      })
  );
});

// Fetch resources from the cache or network
self.addEventListener("fetch", (event) => {
  console.log("[Service Worker] Fetch event for:", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("[Service Worker] Serving from cache:", event.request.url);
        return response;
      }
      console.log("[Service Worker] Fetching from network:", event.request.url);
      return fetch(event.request).catch((error) => {
        console.error("[Service Worker] Fetch failed for:", event.request.url, error);
        // Optionally, return a fallback response here (e.g., a custom offline page)
      });
    })
  );
});

// Update the service worker and remove old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate event triggered");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).catch((error) => {
      console.error("[Service Worker] Error during activation:", error);
    })
  );
});