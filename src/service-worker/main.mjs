import { ASSET_GENERATION, ASSETS } from "./assets.mjs";

const CURRENT_ASSET_CACHE = `assets-${ASSET_GENERATION}`;
const RUNTIME_CACHE = "runtime";

const currentCaches = [CURRENT_ASSET_CACHE, RUNTIME_CACHE];

// The install handler takes care of precaching the resources we always need.
self.addEventListener("install", event =>
  event.waitUntil(
    caches
      .open(CURRENT_ASSET_CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(self.skipWaiting())
  )
);

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event =>
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
      )
      .then(cachesToDelete =>
        Promise.all(
          cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))
        )
      )
      .then(() => self.clients.claim())
  )
);

self.addEventListener("fetch", event => {
  if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// don't try to handle e.g. data: URIs
	if (!url.protocol.startsWith('http')) return;
	if (!url.pathname.endsWith('api/authenticate')) return;

	// ignore dev server requests
	if (url.hostname === self.location.hostname && url.port !== self.location.port) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches
        .open(RUNTIME_CACHE)
        .then(cache =>
          fetch(event.request).then(response =>
            cache.put(event.request, response.clone()).then(() => response)
          )
        );
    })
  );
});
