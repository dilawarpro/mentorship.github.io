const CACHE_NAME = "app-cache-v7"; // Increment cache version
const STATIC_CACHE = "static-cache-v7";
const DYNAMIC_CACHE = "dynamic-cache-v7";

// Core assets that should be cached immediately
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/404.html",
  "/styles.css",
  "/scripts.js",
  "/dilawarmentorship.jpeg",
  "/manifest.json"
];

// Maximum number of items to store in dynamic cache
const MAX_CACHE_ITEMS = 50;

// Cache expiration time in milliseconds (7 days)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

// Install service worker and cache core assets
self.addEventListener("install", event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(CORE_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE)
    ]).catch(err => {
      console.error("Cache error during install:", err);
    })
  );
  self.skipWaiting();
});

// Activate service worker and clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Enhanced fetch event handler with better caching strategy
self.addEventListener("fetch", event => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return cached response if available
      if (cachedResponse) {
        // Update cache in the background
        fetchAndCache(event.request);
        return cachedResponse;
      }

      // Network first strategy for API requests
      if (event.request.url.includes("/api/")) {
        return networkFirst(event.request);
      }

      // Cache first strategy for static assets
      return cacheFirst(event.request);
    })
  );
});

// Network first strategy for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || offlineResponse(request);
  }
}

// Cache first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in the background
    fetchAndCache(request);
    return cachedResponse;
  }
  return fetchAndCache(request);
}

// Fetch and cache response
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      // Clean up old cache entries
      cleanCache(cache);
    }
    return response;
  } catch (error) {
    return offlineResponse(request);
  }
}

// Clean up old cache entries
async function cleanCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_ITEMS) {
    const itemsToDelete = keys.slice(0, keys.length - MAX_CACHE_ITEMS);
    await Promise.all(itemsToDelete.map(key => cache.delete(key)));
  }
}

// Generate offline response
function offlineResponse(request) {
  if (request.mode === "navigate") {
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
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .logo {
            width: 150px;
            height: 150px;
            margin-bottom: 20px;
            animation: fadeIn 1.5s ease-in-out;
            border-radius: 50%;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          .message {
            font-size: 2rem;
            margin: 20px 0;
            line-height: 1.6;
            animation: fadeIn 2s ease-in-out;
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
}

// Push notification event listener
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new message.",
    icon: data.icon || "/dilawarmentorship.jpeg",
    badge: data.badge || "/dilawarmentorship.jpeg",
    data: data.url || "/",
    vibrate: [100, 50, 100],
    requireInteraction: true
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
