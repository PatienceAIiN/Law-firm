'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  brand?: any
  navigation?: any[]
  contact?: any
  mobileOpen: boolean
  onToggleMobile: () => void
}

const PRACTICE_DROPDOWN = [
  { name: 'All Practice Areas', href: '/practice-areas' },
]

export function Header({
  brand,
  navigation: dbNavigation,
  contact,
  mobileOpen,
  onToggleMobile,
}: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [practiceOpen, setPracticeOpen] = useState(false)

  const navigation = (dbNavigation || [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Practice Areas', href: '/practice-areas' },
    { name: 'Consultation', href: '/consultation' },
    { name: 'Contact', href: '/contact' },
  ]).map((item) => {
    const href = item.name === 'Practice Areas' ? '/practice-areas' : item.href
    return { ...item, href }
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const routes = navigation
      .map((item) => item?.href)
      .filter((href): href is string => typeof href === 'string')
      .map((href) => href.split('#')[0])
      .filter((href) => href && href !== '#')
    Array.from(new Set(routes)).forEach((href) => {
      try { router.prefetch(href) } catch {}
    })
  }, [navigation, router])

  useEffect(() => {
    setPracticeOpen(false)
  }, [pathname])

  const mainNav = navigation.filter((item) => item.href !== '/practice-areas')
  const isPracticeActive = pathname === '/practice-areas' || pathname.startsWith('/practice-areas/')

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-[#e8e3dc] bg-[#faf8f5]/95 shadow-[0_1px_16px_0_rgba(30,20,10,0.06)] backdrop-blur-md'
          : 'border-b border-transparent bg-[#faf8f5]'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1208] text-sm font-black tracking-tight text-[#d4a853]">
            {brand?.logo_text || 'SA'}
          </div>
          <div className="hidden sm:block">
            <span className="block text-sm font-semibold leading-tight tracking-tight text-[#1a1208]">
              {brand?.firm_name || 'Senior Advocate'}
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-[#8c7355]">
              Law Chambers
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const href = item.href || '/'
            const isAnchor = href.includes('#')
            const isActive =
              !isAnchor &&
              (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)))

            const linkClass = cn(
              'relative px-3.5 py-2 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'text-[#1a1208]'
                : 'text-[#5c4d38] hover:text-[#1a1208]'
            )

            return (
              <div key={`${item.name}-${item.href}`} className="relative">
                {isAnchor ? (
                  <a href={href} className={linkClass}>
                    {item.name}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-px bg-[#1a1208]" />
                    )}
                  </a>
                ) : (
                  <Link href={href} prefetch className={linkClass}>
                    {item.name}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-px bg-[#1a1208]" />
                    )}
                  </Link>
                )}
              </div>
            )
          })}

          {/* Practice Areas dropdown */}
          <div className="relative">
            <button
              onClick={() => setPracticeOpen((v) => !v)}
              onBlur={() => setTimeout(() => setPracticeOpen(false), 150)}
              className={cn(
                'relative flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors duration-150',
                isPracticeActive ? 'text-[#1a1208]' : 'text-[#5c4d38] hover:text-[#1a1208]'
              )}
            >
              Practice Areas
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform duration-200', practiceOpen && 'rotate-180')}
              />
              {isPracticeActive && (
                <span className="absolute inset-x-3 -bottom-px h-px bg-[#1a1208]" />
              )}
            </button>
            {practiceOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-[#e8e3dc] bg-white py-1.5 shadow-[0_8px_32px_rgba(30,20,10,0.10)]">
                {PRACTICE_DROPDOWN.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2.5 text-sm font-medium text-[#5c4d38] transition-colors hover:bg-[#faf8f5] hover:text-[#1a1208]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/consultation"
            className="hidden rounded-lg bg-[#1a1208] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2d1f0d] sm:inline-flex"
          >
            Book Consultation
          </Link>
          <button
            onClick={onToggleMobile}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c4d38] transition-colors hover:bg-[#f0ece4] hover:text-[#1a1208] lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#e8e3dc] bg-[#faf8f5] lg:hidden">
          <div className="mx-auto max-w-7xl space-y-0.5 px-4 py-3">
            {navigation.map((item) => {
              const href = item.href || '/'
              const isAnchor = href.includes('#')
              const isActive =
                !isAnchor &&
                (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)))

              const cls = cn(
                'flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#1a1208] text-white'
                  : 'text-[#5c4d38] hover:bg-[#f0ece4] hover:text-[#1a1208]'
              )

              return isAnchor ? (
                <a key={href} href={href} className={cls} onClick={onToggleMobile}>
                  {item.name}
                </a>
              ) : (
                <Link key={href} href={href} className={cls} onClick={onToggleMobile}>
                  {item.name}
                </Link>
              )
            })}
            <div className="pt-3">
              <Link
                href="/consultation"
                onClick={onToggleMobile}
                className="flex w-full items-center justify-center rounded-lg bg-[#1a1208] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Book Consultation
              </Link>
            </div>
            {contact?.phone && (
              <div className="pt-2">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex w-full items-center justify-center rounded-lg border border-[#e8e3dc] bg-white px-4 py-2.5 text-sm font-medium text-[#5c4d38]"
                >
                  {contact.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
