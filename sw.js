self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // This can be empty, but it must exist
  event.respondWith(fetch(event.request));
});
