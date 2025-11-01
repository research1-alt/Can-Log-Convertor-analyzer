const CACHE_NAME = 'service-engineer-ai-cache-v2';
const urlsToCache = [
  // App Shell
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',

  // Icons
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',

  // Core Scripts & Styles from CDN
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/@google/genai@^1.22.0',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0',
  'https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs',
  'https://esm.sh/jszip@3.10.1',
  'https://esm.sh/react-is@18.2.0',
  'https://esm.sh/mammoth@1.7.2',
  'https://esm.sh/pdfjs-dist@4.4.168',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.mjs',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a response that we should cache.
            // We cache successful (status 200) same-origin ('basic') and cross-origin ('cors') responses.
            // We also cache 'opaque' responses, though we can't verify their success.
            // Other responses (e.g., 404s) are not cached and are passed through.
            if (!response || (response.status !== 200 && response.type !== 'opaque')) {
              return response;
            }
            
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We only cache GET requests.
                if(event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});