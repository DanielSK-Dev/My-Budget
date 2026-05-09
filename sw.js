// ── Budget PWA Service Worker ─────────────────────────────────────────────
// Bump CACHE_VERSION any time you deploy a new index.html. The activate
// handler will delete the old cache so users automatically get fresh files.
const CACHE_VERSION = 'budget-v1.4.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// ── Install: cache app shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  // Take over immediately — don't wait for old tabs to close
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS))
      .catch(() => { /* non-fatal: network may be unavailable */ })
  );
});

// ── Activate: purge old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())  // take control of open tabs right away
  );
});

// ── Fetch: stale-while-revalidate ────────────────────────────────────────
// Serve cached copy instantly, then fetch fresh copy in background and
// update the cache. This keeps the app fast while ensuring eventual updates.
self.addEventListener('fetch', event => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(cache =>
      cache.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached); // fall back to cache if offline

        // Return cached immediately; background fetch updates cache for next load
        return cached || fetchPromise;
      })
    )
  );
});
