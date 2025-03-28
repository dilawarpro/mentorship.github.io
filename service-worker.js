const CACHE_NAME = "mentorship-cache-v7";
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
  "/dilawarmentorship.jpeg",
  "/offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        if (event.request.mode === "navigate") {
          return new Response(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Offline</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  flex-direction: column;
                  text-align: center;
                  background-color: #f8f8f8;
                  color: #333;
                }
                .message {
                  font-size: 1.5rem;
                  margin-top: 20px;
                }
                .button {
                  display: inline-block;
                  margin-top: 20px;
                  padding: 10px 20px;
                  font-size: 1rem;
                  color: white;
                  background-color: #007bff;
                  text-decoration: none;
                  border-radius: 5px;
                }
                .button:hover {
                  background-color: #0056b3;
                }
              </style>
            </head>
            <body>
              <h1>You are Offline</h1>
              <p class="message">Please check your internet connection and try again.</p>
              <a href="/" class="button">Go to Home</a>
            </body>
            </html>
          `, {
            headers: { "Content-Type": "text/html" }
          });
        }
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});
