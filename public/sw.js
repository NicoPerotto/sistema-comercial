/* Service Worker - Sistema Comercial
 * Estrategia:
 *  - Precache del shell (login, iconos, manifest).
 *  - Assets estaticos (/_next/static, png/svg): cache-first.
 *  - Paginas HTML: network-first con fallback al cache.
 *  - API (/api/): network-only (la cola offline la maneja el cliente con IndexedDB).
 */
const VERSION = 'v1';
const STATIC_CACHE = `static-${VERSION}`;
const SHELL_CACHE = `shell-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_ASSETS).catch(() => {});
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== SHELL_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptamos la API: el cliente maneja su propia cola offline.
  if (url.pathname.startsWith('/api/')) return;

  if (isStaticAsset(url)) {
    // Cache-first (stale-while-revalidate)
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
    return;
  }

  // Páginas HTML: network-first con fallback al shell cacheado.
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(request);
        const cache = await caches.open(SHELL_CACHE);
        cache.put(request, res.clone());
        return res;
      } catch (e) {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        // Fallback a la página de login
        return (await cache.match('/login')) || Response.error();
      }
    })()
  );
});
