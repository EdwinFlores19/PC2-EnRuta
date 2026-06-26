// Service Worker para el Soporte Offline / PWA de EnRuta
const CACHE_NAME = 'en-ruta-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/router-BPi5ZGTk.js',
  '/assets/react-vendor-74C8M9g5.js',
  '/assets/index-r6qgbhNK.css',
  '/assets/index-Bw_3mjS0.js',
  '/assets/http-DhXgJQ-f.js'
];

// Evento de Instalación: Cachea la App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA Service Worker] Cacheando App Shell...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error('[PWA Service Worker] Error agregando archivos al caché:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Evento de Activación: Limpia cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA Service Worker] Eliminando caché antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento Fetch: Estrategia Network-First con fallbacks
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') return;

  // Evitamos interceptar llamadas a la API REST para no enmascarar errores de red
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonamos y la guardamos en el caché
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback a Caché en caso de error de red (Offline)
        console.log('[PWA Service Worker] Modo Offline detectado, sirviendo del caché:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si es una petición de navegación (HTML), servimos el index.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});
