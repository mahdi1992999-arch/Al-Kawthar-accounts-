const CACHE_NAME = 'masarif-alkawthar-v1';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Network-first for Firebase/API calls, cache-first for static assets
self.addEventListener('fetch', function (event) {
  var url = event.request.url;
  var isFirebase = url.indexOf('firebaseio.com') !== -1 ||
                    url.indexOf('googleapis.com') !== -1 ||
                    url.indexOf('gstatic.com') !== -1;

  if (isFirebase) {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (response) {
        return caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
