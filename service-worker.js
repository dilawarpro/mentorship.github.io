const CACHE_NAME = "mentorship-cache-v6"; // Increment cache version
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

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        return new Response(
          `<html>
            <head>
              <title>Offline</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                img { width: 100px; margin-bottom: 20px; }
                .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; 
                       text-decoration: none; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <img src="/dilawarmentorship.jpeg" alt="Logo">
              <h2>You are Offline</h2>
              <p>Please check your internet connection.</p>
              <a href="/" class="btn">Go Back Home</a>
            </body>
          </html>`, 
          { headers: { "Content-Type": "text/html" } }
        );
      });
    })
  );
});

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
