const CACHE = 'fm-v2';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.url.includes('/api/')) return;
  e.respondWith((async () => {
    try {
      return await fetch(req);
    } catch (err) {
      const cached = await caches.match(req);
      return cached || new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
