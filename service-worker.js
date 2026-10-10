/* Animee PWA service worker. Network-first for pages; never cache API/auth requests. */
const CACHE_NAME = "animee-pwa-v31";
const APP_SHELL = ["./index.html","./anime-library.html","./community.html","./community-feed.html","./community-messages.html","./community-reset-password.html","./offline.html","./manifest.webmanifest","./icon.svg","./pwa.js","./animee-loader.js","./animee-design-system.css","./animee-discover.css","./animee-discover.js","./anime-news.js","./anime-news.json","./anime-release-calendar.js","./animee-trending.js","./animee-official-announcements.js","./animee-confirmed-tracker.js","./animee-confirmed-announcements.json","./animee-bottom-panels.js"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const urls = APP_SHELL.map(path => new URL(path, self.registration.scope).href);
    await cache.addAll(urls);
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("animee-pwa-") && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Always check for a fresh shared news index instead of serving a stale cached feed.
  if (url.pathname.endsWith("/anime-news.json") || url.pathname.endsWith("/anime-news.js")) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response && response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) || Response.error();
      }
    })());
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) || (await cache.match(new URL("./offline.html", self.registration.scope).href)) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === "basic") cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
