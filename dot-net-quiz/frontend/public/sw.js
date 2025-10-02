// Service Worker for Fullstack Academy
// Implements caching strategies for optimal Core Web Vitals

const CACHE_NAME = 'fullstack-academy-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/_next/static/css/',
  '/_next/static/js/',
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  documents: 'networkFirst',
  scripts: 'cacheFirst',
  styles: 'cacheFirst',
  images: 'cacheFirst',
  fonts: 'cacheFirst',
  api: 'networkFirst',
  content: 'staleWhileRevalidate'
};

// Cache duration in seconds
const CACHE_DURATIONS = {
  static: 60 * 60 * 24 * 365, // 1 year
  dynamic: 60 * 60 * 24 * 7,  // 1 week
  api: 60 * 5,                // 5 minutes
  content: 60 * 60,           // 1 hour
};

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine resource type and apply appropriate strategy
  const resourceType = getResourceType(request);
  const strategy = CACHE_STRATEGIES[resourceType] || 'networkFirst';
  
  event.respondWith(
    handleRequest(request, strategy, resourceType)
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: data.tag || 'default',
        requireInteraction: true,
        actions: data.actions || []
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

function getResourceType(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const accept = request.headers.get('accept') || '';
  
  // API requests
  if (pathname.startsWith('/api/')) {
    return 'api';
  }
  
  // Content files
  if (pathname.startsWith('/content/')) {
    return 'content';
  }
  
  // Static assets
  if (pathname.includes('/_next/static/')) {
    if (pathname.includes('.css')) return 'styles';
    if (pathname.includes('.js')) return 'scripts';
    return 'static';
  }
  
  // Images
  if (accept.includes('image/') || /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(pathname)) {
    return 'images';
  }
  
  // Fonts
  if (accept.includes('font/') || /\.(woff|woff2|ttf|eot)$/i.test(pathname)) {
    return 'fonts';
  }
  
  // Stylesheets
  if (accept.includes('text/css') || pathname.endsWith('.css')) {
    return 'styles';
  }
  
  // Scripts
  if (accept.includes('javascript') || pathname.endsWith('.js')) {
    return 'scripts';
  }
  
  // Documents
  if (accept.includes('text/html')) {
    return 'documents';
  }
  
  return 'static';
}

async function handleRequest(request, strategy, resourceType) {
  try {
    switch (strategy) {
      case 'cacheFirst':
        return await cacheFirst(request, resourceType);
      case 'networkFirst':
        return await networkFirst(request, resourceType);
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request, resourceType);
      case 'networkOnly':
        return await fetch(request);
      case 'cacheOnly':
        return await caches.match(request);
      default:
        return await networkFirst(request, resourceType);
    }
  } catch (error) {
    console.error('Request handling failed:', error);
    return await handleFallback(request, resourceType);
  }
}

async function cacheFirst(request, resourceType) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(getCacheName(resourceType));
    cache.put(request, response.clone());
  }
  
  return response;
}

async function networkFirst(request, resourceType) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(getCacheName(resourceType));
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, resourceType) {
  const cached = await caches.match(request);
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(getCacheName(resourceType));
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);
  
  return cached || await networkResponsePromise;
}

function getCacheName(resourceType) {
  switch (resourceType) {
    case 'documents':
    case 'api':
      return RUNTIME_CACHE;
    case 'scripts':
    case 'styles':
    case 'fonts':
      return STATIC_CACHE;
    case 'images':
    case 'content':
    default:
      return DYNAMIC_CACHE;
  }
}

async function handleFallback(request, resourceType) {
  const url = new URL(request.url);
  
  // Return offline page for document requests
  if (resourceType === 'documents') {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Return placeholder for images
  if (resourceType === 'images') {
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#9ca3af">Image unavailable</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  // Return empty response for other resources
  return new Response('', { status: 204 });
}

async function handleBackgroundSync() {
  // Handle offline actions when network is restored
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to process offline action:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineActions() {
  // Retrieve offline actions from IndexedDB
  return [];
}

async function processOfflineAction(action) {
  // Process offline action (e.g., sync progress, submit quiz answers)
  const response = await fetch(action.url, {
    method: action.method,
    headers: action.headers,
    body: action.body
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

async function removeOfflineAction(actionId) {
  // Remove processed action from IndexedDB
}

// Clean up old caches periodically
async function cleanupCaches() {
  const cacheNames = await caches.keys();
  const now = Date.now();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cacheDate = new Date(dateHeader).getTime();
          const maxAge = getCacheMaxAge(cacheName);
          
          if (now - cacheDate > maxAge * 1000) {
            await cache.delete(request);
          }
        }
      }
    }
  }
}

function getCacheMaxAge(cacheName) {
  if (cacheName === STATIC_CACHE) return CACHE_DURATIONS.static;
  if (cacheName === RUNTIME_CACHE) return CACHE_DURATIONS.api;
  if (cacheName === DYNAMIC_CACHE) return CACHE_DURATIONS.dynamic;
  return CACHE_DURATIONS.dynamic;
}

// Cleanup old caches every 24 hours
setInterval(cleanupCaches, 24 * 60 * 60 * 1000);