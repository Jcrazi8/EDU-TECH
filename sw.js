/* ============================================================
   sw.js — EduTech Service Worker
   Strategy:
     - Static assets (CSS, JS, fonts, images): cache-first
     - HTML pages: network-first with cache fallback
     - Netlify Functions (/.netlify/functions/*): network-only
   ============================================================ */

const CACHE_VERSION = 'edutech-v1';
const STATIC_CACHE  = CACHE_VERSION + '-static';
const PAGE_CACHE    = CACHE_VERSION + '-pages';

const STATIC_ASSETS = [
  '/css/style.css',
  '/css/admin.css',
  '/css/dashboard.css',
  '/css/founder.css',
  '/css/login.css',
  '/css/skeleton.css',
  '/js/ui.js',
  '/js/auth.js',
  '/js/main.js',
  '/js/certify.js',
  '/js/sentry-init.js',
  '/js/supabase-client.js',
  '/manifest.json',
  '/public/icon-192.png',
  '/public/icon-512.png'
];

const PRECACHE_PAGES = [
  '/',
  '/index.html',
  '/pages/services.html',
  '/pages/certify.html',
  '/pages/contact.html',
  '/pages/about.html',
  '/pages/founders.html',
  '/pages/login.html',
  '/pages/admin.html',
  '/pages/dashboard.html'
];

/* ---- install: pre-cache static assets ---- */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        console.warn('[SW] Pre-cache partial failure (ok):', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ---- activate: clean old caches ---- */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key.startsWith('edutech-') && key !== STATIC_CACHE && key !== PAGE_CACHE;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ---- fetch ---- */
self.addEventListener('fetch', function(event) {
  var url = event.request.url;
  var method = event.request.method;

  /* Only handle GET */
  if (method !== 'GET') return;

  /* Skip Netlify functions — always network-only */
  if (url.includes('/.netlify/functions/')) return;

  /* Skip chrome-extension and non-http */
  if (!url.startsWith('http')) return;

  var parsedUrl = new URL(url);
  var pathname = parsedUrl.pathname;

  /* Static assets: cache-first */
  var isStatic = /\.(css|js|woff2?|ttf|otf|eot|png|jpg|jpeg|gif|svg|ico|webp)(\?.*)?$/.test(pathname);
  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200 && response.type !== 'opaque') {
            var cloned = response.clone();
            caches.open(STATIC_CACHE).then(function(cache) {
              cache.put(event.request, cloned);
            });
          }
          return response;
        }).catch(function() {
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  /* HTML pages: network-first with cache fallback */
  var isPage = pathname.endsWith('.html') || pathname === '/' || pathname === '';
  if (isPage) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var cloned = response.clone();
          caches.open(PAGE_CACHE).then(function(cache) {
            cache.put(event.request, cloned);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  /* Everything else: network with cache fallback */
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
