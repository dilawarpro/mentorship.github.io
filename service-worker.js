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
      // Serve fallback offline page for navigation requests
      if (event.request.mode === "navigate") {
        return caches.match("/index.html");
      }
      return new Response("You are offline and this resource is not cached.", {
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
