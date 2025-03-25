let CACHE_VERSION = 'app-v27';
let CACHE_FILES = [
  "/",
  "/index.html",
  "/appointment.html",
  "/2-months-mentorship.html",
  "/champions-mentorship.html",
  "/refund-policy.html",
  "/404.html",
  "/styles.css", // Add your CSS file paths
  "/scripts.js",
  'js/libraries/bootstrap.min.js',
  'js/libraries/sweetalert2.all.min.js',
  'manifest.json',
  '/icons', // Add your JS file paths
  "/dilawarmentorship.jpeg" // Add your image paths
];

self.addEventListener('install', (event) => {
  event.waitUntil(
      caches.open(CACHE_VERSION).then((cache) => {
          console.log('Opened cache');
          return cache.addAll(CACHE_FILES);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (!navigator.onLine) {
      event.respondWith(
          caches.match(event.request).then((response) => {
              return response || fetchAndCache(event);
          })
      );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
      caches.keys().then((keys) => {
          return Promise.all(
              keys.map((key) => {
                  if (key !== CACHE_VERSION) {
                      return caches.delete(key);
                  }
              })
          );
      })
  );
  self.clients.claim();
});

function fetchAndCache(event) {
  return fetch(event.request).then((response) => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
      }
      let responseClone = response.clone();
      caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, responseClone);
      });
      return response;
  });
}