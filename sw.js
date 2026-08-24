// CACHE_NAME is auto-generated at build time by package.json. Do not edit manually.
const CACHE_NAME = 'jxdd-cache-[DEPLOY_HASH]';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/nav.js',
  '/audio.js',
  '/assets/images/jx-hero.png',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bypass Supabase
  if (url.hostname.includes('supabase')) {
    return; // allow default network request
  }

  // Identify HTML/navigation requests
  const isHtmlRequest = event.request.mode === 'navigate' || 
                        url.pathname.endsWith('.html') || 
                        url.pathname === '/';

  // Identify other cacheable assets (CDN, fonts, local assets)
  const isCachable = 
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'cdn.jsdelivr.net' ||
    url.origin === location.origin;

  if (isCachable && event.request.method === 'GET') {
    if (isHtmlRequest) {
      // Network-first for HTML
      event.respondWith(
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors' || networkResponse.type === 'opaque')) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback to cache
            return caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) return cachedResponse;
              // Ultimate fallback for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match('/');
              }
            });
          })
      );
    } else {
      // Cache-first for CSS, JS, images, fonts, etc.
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;

          return fetch(event.request).then(networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors' && networkResponse.type !== 'opaque')) {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return networkResponse;
          }).catch(() => {
            // Nothing to do for failed non-HTML assets
          });
        })
      );
    }
  }
});
