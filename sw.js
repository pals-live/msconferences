const CACHE_NAME = 'msbuild-sessions-pwa-v2';
const APP_SHELL = [
  './',
  './index-pwa.html',
  './manifest.webmanifest',
  './icons/pwa-icon-192.svg',
  './icons/pwa-icon-512.svg',
  './icons/pwa-maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  const isSessionData = request.url.includes('eventtools.event.microsoft.com');
  const isAppShellRequest =
    request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('/index-pwa.html') ||
    requestUrl.pathname === '/';

  if (isAppShellRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index-pwa.html', copy));
          return networkResponse;
        })
        .catch(() => caches.match('./index-pwa.html'))
    );
    return;
  }

  if (isSessionData) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return networkResponse;
        })
        .catch(() => caches.match('./index-pwa.html'));
    })
  );
});
