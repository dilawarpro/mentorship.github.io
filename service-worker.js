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

const MAX_CACHE_ITEMS = 50; // Limit cache size

// Install service worker and cache required assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).catch(err => console.error("Cache error during install:", err))
  );
  self.skipWaiting(); // Activate new service worker immediately
});

// Fetch resources from cache or fallback to offline page
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return; // Ignore non-GET requests

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(networkResponse => {
          if (!event.request.url.includes("/api/") && event.request.url.startsWith(self.location.origin)) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              cache.keys().then(keys => {
                if (keys.length > MAX_CACHE_ITEMS) cache.delete(keys[0]); // Remove old cache items
              });
              return networkResponse;
            });
          }
          return networkResponse;
        });
    }).catch(() => {
      // Serve fallback offline response for navigation requests
      if (event.request.mode === "navigate") {
        return new Response(`
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    body {
      margin: 0;
      font-family: 'Arial', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #333;
      text-align: center;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .logo {
      width: 150px;
      height: 150px;
      margin-bottom: 20px;
      animation: fadeIn 1.5s ease-in-out;
      border-radius: 50%;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); /* Add shadow for depth */
    }
    .message {
      font-size: 2rem;
      margin: 20px 0;
      line-height: 1.6;
      animation: fadeIn 2s ease-in-out;
      color: #555;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      font-size: 1.2rem;
      color: #fff;
      background: linear-gradient(to right, rgb(0, 221, 255) 0%, rgb(255, 0, 212) 100%);
      border: none;
      border-radius: 50px;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      margin-top: 30px;
      animation: fadeIn 2.5s ease-in-out;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); 
    }
    .button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3); 
    }
    .button i {
      margin-right: 10px;
    }
  </style>
</head>
<body>
  <img src="/dilawarmentorship.jpeg" alt="Logo" class="logo">
  <p class="message"><i class="fas fa-wifi-slash"></i> You are offline. Please check your connection.</p>
  <a href="https://mentorship.dilawarpro.com" class="button"><i class="fas fa-home"></i> Back to Home</a>
</body>
</html>
        `, {
          headers: { "Content-Type": "text/html" }
        });
      }
      return new Response("You're currently offline. Please connect to the internet and try again!", {
        status: 503,
        statusText: "Service Unavailable"
      });
    })
  );
});

// Activate service worker and delete old caches
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
  self.clients.claim(); // Take control immediately
});

// Push notification event listener
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new message.",
    icon: data.icon || "/dilawarmentorship.jpeg",
    badge: data.badge || "/dilawarmentorship.jpeg",
    data: data.url || "/"
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event listener
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === event.notification.data && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});
