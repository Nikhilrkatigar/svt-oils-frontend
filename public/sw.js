const CACHE_NAME = 'svt-oils-pwa-v2'
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/svt-logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.pathname.startsWith('/api')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy))
          }
          return response
        })
        .catch(err => {
          return caches.match('/index.html')
            .then(cachedResponse => cachedResponse || caches.match('/offline.html'))
            .then(fallback => fallback || new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title><style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f9f9f9;color:#333;}h1{color:#ff4d4f;}</style></head><body><h1>Connection Lost</h1><p>Please check your internet connection.</p></body></html>',
              {
                status: 503,
                headers: { 'Content-Type': 'text/html' }
              }
            ))
        })
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request))
  )
})
