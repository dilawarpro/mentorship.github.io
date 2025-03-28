const CACHE_NAME = "mentorship-cache-v8"; const urlsToCache = [ "/", "/index.html", "/appointment.html", "/2-months-mentorship.html", "/champions-mentorship.html", "/refund-policy.html", "/404.html", "/styles.css", "/scripts.js", "/dilawarmentorship.jpeg" ];

self.addEventListener("install", (event) => { event.waitUntil( caches.open(CACHE_NAME).then((cache) => { return cache.addAll(urlsToCache); }) ); self.skipWaiting(); });

self.addEventListener("fetch", (event) => { if (event.request.method !== "GET") return;

event.respondWith( caches.match(event.request, { ignoreSearch: true }) .then((cachedResponse) => { if (cachedResponse) return cachedResponse;

return fetch(event.request)
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
                  margin: 0;
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  color: #333;
                  text-align: center;
                  background-color: #f8f9fa;
                }
                .message {
                  font-size: 1.5rem;
                  margin: 20px;
                }
                .button {
                  padding: 10px 20px;
                  font-size: 1rem;
                  color: #fff;
                  background: #007bff;
                  border: none;
                  border-radius: 5px;
                  text-decoration: none;
                  cursor: pointer;
                  margin-top: 20px;
                }
                .button:hover {
                  background: #0056b3;
                }
              </style>
            </head>
            <body>
              <h1>You're Offline</h1>
              <p class="message">Please check your internet connection and try again.</p>
              <a href="/" class="button">Go to Home</a>
            </body>
            </html>
          `, { headers: { "Content-Type": "text/html" } });
        }
      });
  })

); });

self.addEventListener("activate", (event) => { event.waitUntil( caches.keys().then((cacheNames) => { return Promise.all( cacheNames.map((cacheName) => { if (cacheName !== CACHE_NAME) return caches.delete(cacheName); }) ); }) ); self.clients.claim(); });

