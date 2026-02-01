/**
 * ===================================================================
 * EDUNET19 - SERVICE WORKER
 * Gestione cache e funzionalità offline base
 * ===================================================================
 */

const CACHE_VERSION = 3; // Increment to force update
const CACHE_NAME = `edunet19-v${CACHE_VERSION}`;
const STATIC_CACHE = `edunet19-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `edunet19-dynamic-v${CACHE_VERSION}`;

const SW_PATH = self.location.pathname;
const BASE_PATH = SW_PATH.endsWith('/sw.js')
  ? SW_PATH.slice(0, -'/sw.js'.length)
  : SW_PATH.substring(0, SW_PATH.lastIndexOf('/') + 1);
const BASE_URL = BASE_PATH === '' ? '/' : (BASE_PATH.endsWith('/') ? BASE_PATH : `${BASE_PATH}/`);
const withBasePath = (path) => `${BASE_URL}${path.replace(/^\//, '')}`;

// Risorse statiche da cachare immediatamente
const STATIC_ASSETS = [
  BASE_URL,
  withBasePath('index.html'),
  withBasePath('homepage.html'),
  withBasePath('styles.css'),
  withBasePath('favicon.svg'),
  withBasePath('favicon.ico')
];

// Risorse da cachare on-demand
const CACHEABLE_EXTENSIONS = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];

/**
 * Installazione Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        // Cache solo le risorse che esistono, ignora errori
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Could not cache ${url}:`, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Installed');
        return self.skipWaiting();
      })
  );
});

/**
 * Attivazione Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Rimuovi cache vecchie
              return name.startsWith('edunet19-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('🗑️ Service Worker: Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

/**
 * Intercetta richieste di rete
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignora richieste non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignora richieste a Supabase (devono sempre andare al server)
  if (url.hostname.includes('supabase')) {
    return;
  }
  
  // Ignora richieste chrome-extension e altri protocolli non-http
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // IMPORTANTE: Non intercettare richieste con query parameters
  // per evitare di perdere parametri come ?id=xxx
  if (url.search) {
    console.log('📦 SW: Bypassing cache for URL with query params:', url.href);
    return;
  }
  
  // Strategia: Network First per HTML, Cache First per assets statici
  if (request.headers.get('accept')?.includes('text/html')) {
    // Network First per pagine HTML
    event.respondWith(networkFirst(request));
  } else if (isCacheableAsset(url.pathname)) {
    // Cache First per assets statici
    event.respondWith(cacheFirst(request));
  }
});

/**
 * Verifica se un asset è cacheabile
 */
function isCacheableAsset(pathname) {
  return CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

/**
 * Strategia Network First
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache la risposta se valida
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback alla cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Pagina offline di fallback
    return new Response(
      `<!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EduNet19 - Offline</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
            color: white;
            text-align: center;
            padding: 2rem;
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { margin: 0 0 1rem; font-size: 1.5rem; }
          p { margin: 0 0 2rem; opacity: 0.8; }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="icon">📡</div>
        <h1>Sei offline</h1>
        <p>Controlla la tua connessione internet e riprova.</p>
        <button onclick="location.reload()">Riprova</button>
      </body>
      </html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

/**
 * Strategia Cache First
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Aggiorna cache in background (stale-while-revalidate)
    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, networkResponse);
        }
      })
      .catch(() => {});
    
    return cachedResponse;
  }
  
  // Se non in cache, fetch e cache
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Ritorna errore generico per assets mancanti
    return new Response('Asset not available offline', { status: 503 });
  }
}

/**
 * Gestione messaggi dal client
 */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith('edunet19-')) {
          caches.delete(name);
        }
      });
    });
  }
});

console.log('📦 EduNet19 Service Worker loaded');
