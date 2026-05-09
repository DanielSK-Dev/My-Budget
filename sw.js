// ── Budget PWA Service Worker ─────────────────────────────────────────────
// No release-tied CACHE_VERSION — APP_VERSION lives only in index.html.
//
// Strategy:
//   • HTML / navigation requests → network-first (always grab fresh
//     index.html when online; fall back to cache only when offline)
//   • All other GET requests     → stale-while-revalidate (instant from
//     cache, refresh in background)
//
// This means edits to index.html show up on the very next reload without
// having to bump anything. The cache name is a single static string;
// activate purges any old release-named caches that might be lingering.
const CACHE = 'budget-app';
const ASSETS = ['./', './index.html', './manifest.json'];

// ── Install: pre-cache app shell ──────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .catch(() => { /* non-fatal: network may be unavailable */ })
  );
});

// ── Activate: drop any caches that aren't ours (e.g. old budget-v1.x.x) ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────
const isNavigationRequest = req =>
  req.mode === 'navigate' ||
  (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));

// ── Fetch: route by request type ─────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (isNavigationRequest(req)) {
    // Network-first for HTML / navigations. This is what makes updates
    // appear without a version bump — fresh index.html on every reload.
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() =>
          caches.open(CACHE).then(c =>
            c.match(req).then(cached =>
              cached || c.match('./index.html') || new Response('', {status: 503})
            )
          )
        )
    );
    return;
  }

  // Stale-while-revalidate for everything else (manifest, icons, etc.)
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req).then(cached => {
        const fetchPromise = fetch(req)
          .then(res => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
