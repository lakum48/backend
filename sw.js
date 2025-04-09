const CACHE_NAME = 'notes-cache-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/icons/icon-72x72.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/fallback.html'
];

// Установка
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Активация
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэш, если есть
                if (response) {
                    return response;
                }
                
                // Иначе делаем запрос
                return fetch(event.request)
                    .then(response => {
                        // Кэшируем новые ресурсы
                        if (!response || response.status !== 200 || 
                            response.type !== 'basic' ||
                            !event.request.url.startsWith('http')) {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseToCache));
                        
                        return response;
                    })
                    .catch(() => {
                        // Fallback для страниц
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/fallback.html');
                        }
                    });
            })
    );
});