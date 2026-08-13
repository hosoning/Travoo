// ── Travoo Service Worker v4 ──────────────────────────────────
// Bump version number any time you deploy new files.
// This forces old clients to re-fetch everything.
const VERSION = 'travoo-v7';

// Derive base URL from SW's own location so it works on any path
// (root domain, GitHub Pages subdir, Cloudflare Pages, etc.)
const BASE = self.registration.scope;

const CORE_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'app.js',
  BASE + 'manifest.json'
];

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing', VERSION);
  event.waitUntil(
    caches.open(VERSION).then(cache => {
      // Use Promise.allSettled so one failing asset doesn't abort install
      return Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Failed to cache:', url, err.message);
          })
        )
      );
    })
  );
  // Take over immediately — don't wait for old SW to idle
  self.skipWaiting();
});

// ── ACTIVATE ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating', VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== VERSION)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = req.url;

  // Never intercept Firebase / Google CDN requests
  // (they have their own caching and need live network)
  if (
    url.includes('firebasejs') ||
    url.includes('gstatic.com') ||
    url.includes('googleapis.com') ||
    url.includes('firestore.googleapis') ||
    url.includes('firebase.googleapis')
  ) {
    return;
  }

  // Strategy: Cache-first, then network, fallback to index.html
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // Serve from cache, but also refresh in background (stale-while-revalidate)
        const fetchPromise = fetch(req)
          .then(networkRes => {
            if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
              caches.open(VERSION).then(c => c.put(req, networkRes.clone()));
            }
            return networkRes;
          })
          .catch(() => {/* offline — cached version already served */});

        return cached;
      }

      // Not in cache — try network
      return fetch(req)
        .then(networkRes => {
          if (!networkRes || networkRes.status !== 200 || networkRes.type === 'opaque') {
            return networkRes;
          }
          // Cache for next time
          const clone = networkRes.clone();
          caches.open(VERSION).then(c => c.put(req, clone));
          return networkRes;
        })
        .catch(() => {
          // Offline fallback: return cached index.html for navigation requests
          if (req.mode === 'navigate') {
            return caches.match(BASE + 'index.html');
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {
    title: 'Travoo',
    body: 'Check your latest itinerary update'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: 'travoo-push',
      renotify: true,
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(BASE) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(BASE);
    })
  );
});
