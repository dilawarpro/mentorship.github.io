const CACHE_NAME = "mentorship-cache-v4"; 
const urlsToCache = ["/", "/index.html", "/appointment.html", "/2-months-mentorship.html", "/champions-mentorship.html", "/refund-policy.html", "/404.html", "/styles.css", "/scripts.js", "/dilawarmentorship.jpeg"];
const MAX_CACHE_ITEMS = 50; 

self.addEventListener("install", event => { 
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(err => console.error("Cache error:", err))); 
  self.skipWaiting(); 
});

self.addEventListener("fetch", event => { 
  if (event.request.method !== "GET") return; 
  event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(event.request).then(response => response || fetch(event.request).then(networkResponse => { 
    if (!event.request.url.includes("/api/")) { 
      cache.put(event.request, networkResponse.clone()); 
      cache.keys().then(keys => { if (keys.length > MAX_CACHE_ITEMS) cache.delete(keys[0]); });
    } 
    return networkResponse; 
  }))));
});

self.addEventListener("activate", event => { 
  event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => { 
    if (cacheName !== CACHE_NAME) return caches.delete(cacheName); 
  }))));
  self.clients.claim(); 
});
