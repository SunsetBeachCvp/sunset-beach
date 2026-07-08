const CACHE_NAME = 'sunset-beach-v20260708-fixed_V4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './maskable-icon-192.png',
  './maskable-icon-512.png',
  './apple-touch-icon.png'
];

// 1. Installazione: crea la nuova cache e scarica gli asset
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 2. Attivazione: cancella tutte le vecchie cache inutilizzate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 3. Fetch: strategia Network-First con salvataggio sicuro in cache
self.addEventListener('fetch', event => {
  // Gestisce solo le richieste GET
  if (event.request.method !== 'GET') return;

  // Gestisce solo le richieste interne al tuo sito (evita estensioni o API esterne)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva in cache SOLO le risposte valide (Stato 200 OK)
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        // Se la rete fallisce (sei offline), cerca il file specifico nella cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          // Se l'utente sta navigando tra le pagine e non trova nulla, mostra l'index
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
