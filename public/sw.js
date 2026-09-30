// CACHE_NAME is auto-generated at build time by package.json. Do not edit manually.
const CACHE_NAME = 'jxdd-cache-v1790728593152';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/style.css',
  '/script.js',
  '/nav.js',
  '/audio.js',
  '/assets/images/jx-hero.webp',
  'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js',
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
    const isAsset = event.request.url.match(/\.(png|jpe?g|webp|svg|gif|woff2?|mp4)$/i) || 
                    url.hostname.includes('fonts.');
                    
    if (!isAsset) {
      // Network-first for HTML, CSS, JS
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
            return caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) return cachedResponse;
              if (event.request.mode === 'navigate') return caches.match('/404.html');
            });
          })
      );
    } else {
      // Stale-While-Revalidate for images and fonts
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          }).catch(() => {}); // ignore network errors for assets if offline
          
          return cachedResponse || fetchPromise;
        })
      );
    }
  }
});
