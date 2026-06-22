'use client'

import { useEffect } from 'react'

// Registers the service worker so the app is installable / offline-capable.
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {})
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register)
    return () => window.removeEventListener('load', register)
  }, [])
  return null
}
