'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrackCaseButton } from '@/components/track-case-modal'
import { BrandMark } from '@/components/layout/brand-mark'

interface HeaderProps {
  brand?: any
  navigation?: any[]
  contact?: any
  tenantSlug?: string
  mobileOpen: boolean
  onToggleMobile: () => void
}

const DEFAULT_NAV = [
  { name: 'Home', href: '/' },
  { name: 'Consultant', href: '/consultation' },
  { name: 'Articles', href: '/blog' },
  { name: 'Contact', href: '/contact' },
  { name: 'About', href: '/about' },
]

function normalizeNav(items?: any[]) {
  return (items || []).map((n) => ({
    name: n.name || n.label || n.title || '',
    href: n.href || n.url || '#',
  })).filter((n) => n.name && n.href)
}

export function Header({ brand, navigation, tenantSlug, mobileOpen, onToggleMobile }: HeaderProps) {
  const pathname = usePathname()
  const passed = normalizeNav(navigation)
  const NAV = passed.length > 0 ? passed : DEFAULT_NAV
  const homeHref = tenantSlug ? `/team/${tenantSlug}` : '/'
  const lawyerLoginHref = tenantSlug ? `/team/${tenantSlug}/lawyer/login` : '/lawyer/login'

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#F4E8D8] bg-white transition-colors dark:border-white/10 dark:bg-[#11151f]">
      <div className="relative mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 lg:px-8">
        {/* Logo */}
        <BrandMark brand={brand} href={homeHref} imageHeight={40} />

        {/* Center nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
          {NAV.map((item) => {
            const cleanHref = item.href.split('#')[0]
            const active = cleanHref === pathname || (cleanHref !== '/' && pathname.startsWith(cleanHref))
            return (
              <Link
                key={`${item.name}-${item.href}`}
                href={item.href}
                className={cn(
                  'text-[18px] transition-colors',
                  active ? 'font-semibold text-primary dark:text-white' : 'text-primary/80 hover:text-primary dark:text-white/70 dark:hover:text-white',
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link
            href={lawyerLoginHref}
            className="hidden h-[49px] items-center justify-center rounded-[10px] bg-[#F6F0E8] px-6 text-[18px] font-medium text-primary transition-colors hover:bg-[#efe6d8] dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:inline-flex"
          >
            Adv. Portal
          </Link>
          <TrackCaseButton
            label="Track Case"
            className="hidden h-[49px] items-center justify-center rounded-[10px] bg-primary px-6 text-[18px] font-medium text-white transition-colors hover:bg-accent sm:inline-flex"
          />
          <button
            onClick={onToggleMobile}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-primary hover:bg-[#F6F0E8] lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#F4E8D8] bg-white lg:hidden">
          <div className="mx-auto max-w-[1280px] space-y-1 px-5 py-4">
            {NAV.map((item) => (
              <Link
                key={`m-${item.name}-${item.href}`}
                href={item.href}
                onClick={onToggleMobile}
                className="block rounded-[10px] px-4 py-3 text-[17px] text-primary hover:bg-[#F6F0E8]"
              >
                {item.name}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/lawyer/login" onClick={onToggleMobile} className="flex-1 rounded-[10px] bg-[#F6F0E8] py-3 text-center text-[16px] font-medium text-primary">Adv. Portal</Link>
              <TrackCaseButton label="Track Case" className="flex-1 rounded-[10px] bg-primary py-3 text-center text-[16px] font-medium text-white" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
