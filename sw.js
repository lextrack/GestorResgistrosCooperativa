const CACHE_NAME = 'gestor-registros-cooperativa-v1.2.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/balance.html',
  '/dashboard.html',
  '/css/main.css',
  '/css/modals.css',
  '/js/main.js',
  '/js/modules/dataManager.js',
  '/js/modules/chartGenerator.js',
  '/js/modules/cloudBackup.js',
  '/js/modules/currencyFormatter.js',
  '/js/modules/excelExporter.js',
  '/js/modules/exportHandlers.js',
  '/js/modules/jsonHandler.js',
  '/js/modules/pagination.js',
  '/js/modules/pdfExporter.js',
  '/js/modules/uiHelpers.js',
  '/img/icono.ico',
  '/img/icon-192x192.png',
  '/img/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache.map(url => new Request(url, {
          mode: 'cors',
          credentials: 'omit'
        })));
      })
      .catch(error => {
        return;
      })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  if (event.request.url.includes('firebase') || 
      event.request.url.includes('firestore') ||
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                if (event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(error => {
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            throw error;
          });
      })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        message: 'Connectivity restored - syncing data'
      });
    });
  } catch (error) {
    return;
  }
}

self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/img/icon-192x192.png',
    badge: '/img/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'gestor-notification',
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/img/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Gestor Registros', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});