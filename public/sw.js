// Minimal offline cache for the reference site.
// - hashed build assets / images / fonts: cache-first (immutable by name)
// - data JSON + navigations: network-first, cached copy as offline fallback
// Bump CACHE to invalidate everything after a breaking layout change.
const CACHE = 'rdr3-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['./', './index.html']).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

const STATIC_RE = /\/assets\/|\/brand\/|\/images\/|\.(?:png|jpe?g|webp|gif|woff2)$/
const DATA_RE = /\/data\/[^/]+\.json$/

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  if (STATIC_RE.test(url.pathname)) {
    e.respondWith(cacheFirst(request))
  } else if (DATA_RE.test(url.pathname) || request.mode === 'navigate') {
    e.respondWith(networkFirst(request))
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) {
    const c = await caches.open(CACHE)
    c.put(request, res.clone())
  }
  return res
}

async function networkFirst(request) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const c = await caches.open(CACHE)
      c.put(request, res.clone())
    }
    return res
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' })
    if (cached) return cached
    if (request.mode === 'navigate') {
      const shell = await caches.match('./index.html')
      if (shell) return shell
    }
    throw err
  }
}
