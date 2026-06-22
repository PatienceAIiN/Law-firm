'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Auto dark/light by Indian Standard Time — dark 7 PM–6 AM IST — but ONLY on
// the public marketing site. Admin and lawyer portals always stay light (they
// have no dark styles, so dark mode would make their text unreadable).
function istHour() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false,
  }).formatToParts(new Date())
  return Number(parts.find((p) => p.type === 'hour')?.value || '12')
}

export function ThemeAuto() {
  const pathname = usePathname()
  useEffect(() => {
    const apply = () => {
      const portal = pathname.startsWith('/admin') || pathname.startsWith('/lawyer')
      if (portal) {
        document.documentElement.classList.remove('dark')
        return
      }
      let manual: string | null = null
      try { manual = localStorage.getItem('theme-manual') } catch {}
      if (manual === 'dark' || manual === 'light') {
        document.documentElement.classList.toggle('dark', manual === 'dark')
        return
      }
      const h = istHour()
      document.documentElement.classList.toggle('dark', h >= 19 || h < 6)
    }
    apply()
    const t = setInterval(apply, 60_000)
    return () => clearInterval(t)
  }, [pathname])
  return null
}
