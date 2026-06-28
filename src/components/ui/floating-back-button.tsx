'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

// Page-wide back-arrow. Renders on every route EXCEPT the obvious
// "home" pages where back makes no sense (SaaS landing, tenant home).
export function FloatingBackButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!pathname) { setShow(false); return }
    // Hide on roots — no point going "back" from a home page.
    const isMarketingRoot = pathname === '/' || pathname === '/signup' || pathname === '/redeem'
    // Tenant home and lawyer dashboard root — no back arrow.
    const isDashboardRoot = /^\/team\/[^/]+(\/lawyer)?\/?$/.test(pathname)
    // Admin panel — sidebar nav already handles movement; hide arrow on
    // every admin sub-route too.
    const isAdminAnywhere = /^\/team\/[^/]+\/admin(\/|$)/.test(pathname)
    const isLoginPage = /\/(login|activate)$/.test(pathname)
    setShow(!isMarketingRoot && !isDashboardRoot && !isAdminAnywhere && !isLoginPage)
  }, [pathname])

  if (!show) return null

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back()
        else router.push('/')
      }}
      aria-label="Go back"
      title="Go back"
      className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-lg backdrop-blur transition hover:bg-white hover:text-primary active:scale-95 md:left-6 md:top-6 dark:border-white/15 dark:bg-[#11151f]/90 dark:text-slate-300 dark:hover:bg-[#11151f] dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  )
}
