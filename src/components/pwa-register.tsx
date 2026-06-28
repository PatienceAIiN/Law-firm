'use client'

import { useEffect } from 'react'

// Registers the service worker so the app is installable / offline-capable.
// In DEV we actively UNREGISTER any stale SW + clear caches — otherwise a
// previously-visited prod build's SW intercepts dev fetches and serves the
// cached "offline" page, which made forms (UTR / payment submit) look like
// they "didn't reload" after submit.
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const isDev =
      process.env.NODE_ENV !== 'production' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1'

    if (isDev) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {})
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {})
      }
      return
    }

    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {})
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register)
    return () => window.removeEventListener('load', register)
  }, [])
  return null
}
