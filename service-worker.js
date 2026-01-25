const CACHE_VERSION = 'v8'; // <-- Always increment on update
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/404.html",
  "/styles.css",
  "/scripts.js",
  "/dilawarmentorship.jpg",
  "/manifest.json"
];

const MAX_CACHE_ITEMS = 50;
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else if (CORE_ASSETS.includes(new URL(request.url).pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// --- STRATEGIES ---

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return caches.match(request) || offlineResponse(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const network = await fetch(request);
  const cache = await caches.open(STATIC_CACHE);
  cache.put(request, network.clone());
  return network;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        cleanCache(cache);
      }
      return networkResponse;
    })
    .catch(() => null);
  return cached || fetchPromise;
}

// CLEAN OLD CACHE ITEMS
async function cleanCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_ITEMS) {
    const deletions = keys.slice(0, keys.length - MAX_CACHE_ITEMS);
    await Promise.all(deletions.map(k => cache.delete(k)));
  }
}

// OFFLINE FALLBACK
function offlineResponse(request) {
  if (request.mode === "navigate") {
    return caches.match("/404.html");
  }
  return new Response("You are offline", {
    status: 503,
    statusText: "Offline",
  });
}

// PUSH
self.addEventListener("push", event => {
  const data = event.data?.json() || {};
  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new message.",
    icon: data.icon || "/dilawarmentorship.jpg",
    badge: data.badge || "/dilawarmentorship.jpg",
    data: data.url || "/",
    vibrate: [100, 50, 100],
    requireInteraction: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// NOTIFICATION CLICK
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
