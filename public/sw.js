// Service worker — network-first for navigation with offline fallback,
// cache-first for static assets. Bump CACHE to invalidate.
const CACHE = 'lawfirm-v2'
const OFFLINE_URL = '/offline.html'
const PRECACHE = ['/offline.html', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network-first, fall back to cache, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL))),
    )
    return
  }

  // Static assets: cache-first with background refresh. Clone BEFORE the
  // response is handed back to the browser — otherwise by the time
  // caches.put runs (async after caches.open) the body has been consumed
  // and clone() throws "Response body is already used".
  if (url.pathname.startsWith('/_next/static') || /\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          if (res && res.ok) {
            const copy = res.clone()
            event.waitUntil(caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {}))
          }
          return res
        }).catch(() => cached)
        return cached || network
      }),
    )
  }
})

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      data: { url: data.url },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
