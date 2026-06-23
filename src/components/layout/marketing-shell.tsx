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
  const pathname = usePathname()
  const visibleNavigation = (navigation || []).filter((item) => item?.href !== '/blog' && item?.name !== 'Blog')
  const bookHref = tenantSlug ? `/t/${tenantSlug}/book` : '/'
  const contactHref = tenantSlug ? `/t/${tenantSlug}/contact` : '/'

  const openConsultation = useCallback(() => {
    window.location.href = bookHref
  }, [bookHref])
  const openContact = useCallback(() => {
    window.location.href = contactHref
  }, [contactHref])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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
            {children}
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
