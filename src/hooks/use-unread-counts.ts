'use client'

import { useEffect, useState } from 'react'

export type UnreadCounts = {
  inquiries: number
  receipts: number
  payments: number
  mail: number
  chats: number
}

const ZERO: UnreadCounts = { inquiries: 0, receipts: 0, payments: 0, mail: 0, chats: 0 }

// localStorage keys for "last seen" timestamps — per browser session.
// Keep them simple so any tab visit to the matching route can write the
// stamp and silence the chip.
export const SEEN_KEYS = {
  inquiries: 'unread:inquiries:seenAt',
  payments: 'unread:payments:seenAt',
  chats: 'unread:chats:seenAt',
}

// Polls /api/unread-counts every 20 s, refetches on tab focus.
// Returns 0 for any category whose latest item is older than the user's
// last visit to that route — so chips automatically clear once you've
// opened the relevant tab.
export function useUnreadCounts(enabled: boolean = true) {
  const [counts, setCounts] = useState<UnreadCounts>(ZERO)

  useEffect(() => {
    if (!enabled) return
    let alive = true

    const compare = (latestIso: string | null, key: string, raw: number): number => {
      if (!raw || !latestIso) return 0
      try {
        const seen = window.localStorage.getItem(key)
        if (!seen) return raw
        return new Date(latestIso).getTime() > new Date(seen).getTime() ? raw : 0
      } catch {
        return raw
      }
    }

    const load = async () => {
      try {
        const res = await fetch('/api/unread-counts', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!alive) return
        const latest = data.latest || {}
        setCounts({
          inquiries: compare(latest.inquiries, SEEN_KEYS.inquiries, data.inquiries || 0),
          receipts: 0,
          payments: compare(latest.payments, SEEN_KEYS.payments, data.payments || 0),
          mail: data.mail || 0,
          chats: compare(latest.chats, SEEN_KEYS.chats, data.chats || 0),
        })
      } catch {}
    }

    load()
    const id = window.setInterval(load, 20_000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    // React to storage updates from other tabs / pages so visiting the
    // receipts tab clears the chip on the dashboard tab immediately.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SEEN_KEYS.inquiries || e.key === SEEN_KEYS.payments || e.key === SEEN_KEYS.chats) load()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      alive = false
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('storage', onStorage)
    }
  }, [enabled])

  return counts
}

// Call from a route's client component when the user lands on the tab —
// stamps "now" so chips for that category clear immediately.
export function markSeen(key: keyof typeof SEEN_KEYS) {
  if (typeof window === 'undefined') return
  try {
    const k = SEEN_KEYS[key]
    window.localStorage.setItem(k, new Date().toISOString())
    // Trigger same-tab refresh of any mounted useUnreadCounts hooks.
    window.dispatchEvent(new StorageEvent('storage', { key: k, newValue: new Date().toISOString() }))
  } catch {}
}
