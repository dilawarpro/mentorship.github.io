const CACHE_NAME = "mentorship-cache-v1";
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

// Install and cache assets
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => console.error("Caching failed", err));
    })
  );
});

// Activate and clear old caches
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
  self.clients.claim();
});

// Fetch with Cache-First & Professional Offline Page
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Serve from cache
      }
      return fetch(event.request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone()); // Cache the new response
            return networkResponse;
          });
        })
        .catch(() => {
          // Return a professional offline page with a logo and button
          return new Response(`
            <html>
              <head>
                <title>You're Offline</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background-color: #f8f9fa;
                    color: #333;
                    margin: 0;
                  }
                  img {
                    width: 150px;
                    height: auto;
                    margin-bottom: 20px;
                  }
                  h1 {
                    font-size: 22px;
                    margin-bottom: 10px;
                  }
                  p {
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 20px;
                  }
                  button {
                    padding: 10px 20px;
                    font-size: 16px;
                    color: #fff;
                    background-color: #007bff;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                  }
                  button:hover {
                    background-color: #0056b3;
                  }
                </style>
              </head>
              <body>
                <img src="/dilawarmentorship.jpeg" alt="Logo">
                <h1>You are Offline</h1>
                <p>Please check your internet connection and try again.</p>
                <button onclick="location.href='/'">Go Back to Home</button>
              </body>
            </html>
          `, { headers: { "Content-Type": "text/html" } });
        });
    })
  );
})
