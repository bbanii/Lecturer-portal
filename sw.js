const CACHE_NAME = 'lecturer-portal-v1';
const DYNAMIC_CACHE = 'lecturer-portal-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/lecturer.html',
  '/login.html',
  '/offline.html',
  '/lecturer.css',
  '/folder.css',
  '/notifications.css',
  '/assignments.css',
  '/documents.css',
  '/shared-files.css',
  '/upload-modal.css',
  '/file-share.css',
  '/delete-modal.css',
  '/lecturer.js',
  '/assignments.js',
  '/folders.js',
  '/documents.js',
  '/shared-files.js',
  '/upload-document.js',
  '/lecturer-upload.js',
  '/pwa.js',
  '/Logo2.jpg',
  '/favicon.ico',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('Error caching static assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Handle API calls
  if (event.request.url.includes('https://department-mangement-system-97wj.onrender.com/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response before using it
          const responseClone = response.clone();
          
          // Only cache successful responses
          if (response.ok) {
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // If offline, try to return cached response
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cached response, return offline page for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match('/offline.html');
              }
              return new Response(JSON.stringify({ error: 'No internet connection' }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // Handle static assets
  // Skip chrome-extension URLs and other unsupported schemes
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(fetchResponse => {
            // Don't cache non-success responses
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse;
            }

            // Clone the response before using it
            const responseClone = fetchResponse.clone();
            
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
            
            return fetchResponse;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Offline content not available');
          });
      })
  );
});