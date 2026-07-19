// ============================================================================
//  SERVICE WORKER — CFE 2020 PWA
//  Cache para funcionamiento offline
// ============================================================================

const CACHE_NAME = 'cfe-viento-v1.0.0';
const ASSETS_TO_CACHE = [
    '/',
    'index.html',
    'css/style.css',
    'js/app.js',
    'manifest.json',
    'icons/icon-72.png',
    'icons/icon-96.png',
    'icons/icon-128.png',
    'icons/icon-144.png',
    'icons/icon-152.png',
    'icons/icon-192.png',
    'icons/icon-384.png',
    'icons/icon-512.png'
];

// Instalación
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] Instalación completada');
                return self.skipWaiting();
            })
    );
});

// Activación
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Eliminando cache viejo:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] Activación completada');
            return self.clients.claim();
        })
    );
});

// Estrategia: Cache First, luego Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Si está en cache, devolverlo
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Si no, ir a la red
                return fetch(event.request)
                    .then(response => {
                        // No cachear respuestas no válidas
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar y guardar en cache
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback
                        if (event.request.destination === 'document') {
                            return caches.match('index.html');
                        }
                        return new Response('Sin conexión', { status: 503 });
                    });
            })
    );
});

// Notificación push (para futuras actualizaciones)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Actualización disponible',
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-72.png',
        vibrate: [200, 100, 200],
        tag: 'cfe-update'
    };
    
    event.waitUntil(
        self.registration.showNotification('CFE 2020 — Diseño por Viento', options)
    );
});