'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LawAiBubble } from '@/components/chat/law-ai-bubble'
import { WelcomeGreeting } from '@/components/welcome-greeting'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

interface MarketingShellProps {
  children: React.ReactNode
  brand?: any
  navigation?: any[]
  footerConfig?: any
  officeDetails?: any
  practiceAreas?: any[]
  tenantSlug?: string
}

export function MarketingShell({
  children,
  brand,
  navigation,
  footerConfig,
  officeDetails,
  practiceAreas,
  tenantSlug,
}: MarketingShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const pathname = usePathname()
  const visibleNavigation = (navigation || []).filter((item) => item?.href !== '/blog' && item?.name !== 'Blog')
  const bookHref = tenantSlug ? `/team/${tenantSlug}/book` : '/'
  const contactHref = tenantSlug ? `/team/${tenantSlug}/contact` : '/'

  const openConsultation = useCallback(() => {
    window.location.href = bookHref
  }, [bookHref])
  const openContact = useCallback(() => {
    window.location.href = contactHref
  }, [contactHref])

  useEffect(() => {
    setMobileOpen(false)
    setNavigating(false)
  }, [pathname])

  // Global capture: the instant any in-app link (same-origin, different
  // path) is mouse-downed, swap children for a skeleton so the click feels
  // instant. Cleared the moment the new pathname lands.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const target = (e.target as HTMLElement | null)?.closest('a') as HTMLAnchorElement | null
      if (!target) return
      if (target.target && target.target !== '_self') return
      try {
        const url = new URL(target.href, window.location.href)
        if (url.origin !== window.location.origin) return
        const dest = url.pathname + url.search
        const cur = window.location.pathname + window.location.search
        if (dest === cur) return
        setNavigating(true)
      } catch {}
    }
    document.addEventListener('mousedown', onDown, { capture: true })
    return () => document.removeEventListener('mousedown', onDown, { capture: true } as any)
  }, [])

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-white text-slate-900 transition-colors dark:bg-[#0b0f17] dark:text-slate-100">
      <Header
        brand={brand}
        navigation={visibleNavigation}
        contact={officeDetails}
        tenantSlug={tenantSlug}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((value) => !value)}
      />

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <main className="min-h-0 flex-1">
        <div className="mx-auto flex min-h-full w-full max-w-[1680px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="flex-1 bg-white dark:bg-[#0b0f17]">
            {navigating ? <MarketingNavSkeleton /> : children}
          </div>

          <Footer
            brand={brand}
            navigation={visibleNavigation}
            practiceAreas={practiceAreas}
            footerConfig={footerConfig}
            officeDetails={officeDetails}
            tenantSlug={tenantSlug}
          />
        </div>
      </main>

      <WelcomeGreeting />

      <LawAiBubble
        onOpenConsultation={openConsultation}
        onOpenContact={openContact}
      />
    </div>
  )
}

function MarketingNavSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-16">
      <div className="mx-auto h-6 w-40 rounded-full bg-slate-200 dark:bg-white/10" />
      <div className="mx-auto mt-6 h-10 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
      <div className="mx-auto mt-3 h-10 w-2/3 rounded bg-slate-200 dark:bg-white/10" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#11151f]">
            <div className="h-6 w-6 rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-3 h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-2 h-3 w-full rounded bg-slate-100 dark:bg-white/5" />
            <div className="mt-1.5 h-3 w-5/6 rounded bg-slate-100 dark:bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
