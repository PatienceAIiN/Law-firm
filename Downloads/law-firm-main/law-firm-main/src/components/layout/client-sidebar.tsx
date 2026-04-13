'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  BriefcaseBusiness,
  FileText,
  Home,
  Info,
  Mail,
  Menu,
  MessageSquareText,
  Phone,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClientSidebarProps {
  brand?: any
  navigation?: any[]
  contact?: any
  mobileOpen: boolean
  onToggleMobile: () => void
}

const NAV_ICON_MAP: Record<string, any> = {
  '/': Home,
  '/about': Info,
  '/practice-areas': BriefcaseBusiness,
  '/blog': FileText,
  '/consultation': MessageSquareText,
  '/contact': Mail,
}

export function ClientSidebar({
  brand,
  navigation: dbNavigation,
  contact,
  mobileOpen,
  onToggleMobile,
}: ClientSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

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
    const routes = navigation
      .map((item) => item?.href)
      .filter((href): href is string => typeof href === 'string')
      .map((href) => href.split('#')[0])
      .filter((href) => href && href !== '#')

    Array.from(new Set(routes)).forEach((href) => {
      try {
        router.prefetch(href)
      } catch {}
    })
  }, [navigation, router])

  const renderNavItem = (item: (typeof navigation)[number], isMobile = false) => {
    const href = item.href || '/'
    const isAnchor = href.includes('#')
    const isActive = !isAnchor && (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)))
    const Icon = NAV_ICON_MAP[href] || FileText

    const className = cn(
      'flex items-center justify-between rounded-2xl border px-4 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 group',
      isActive
        ? 'bg-[#0a192f] text-white shadow-xl shadow-[#0a192f]/15 border-[#0a192f]'
        : 'border-gray-200 text-slate-600 hover:bg-slate-50 hover:text-[#0a192f] hover:border-gray-300',
      isMobile ? 'w-full' : 'w-full'
    )

    const content = (
      <>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
              isActive ? 'bg-white/10 text-[#c5a059]' : 'bg-slate-100 text-[#0f172a] group-hover:bg-slate-200'
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate">{item.name}</span>
        </div>
        {isActive && <span className="h-2 w-2 rounded-full bg-[#c5a059]" />}
      </>
    )

    if (isAnchor) {
      return (
        <a href={href} className={className} onClick={isMobile ? onToggleMobile : undefined}>
          {content}
        </a>
      )
    }

    return (
      <Link href={href} prefetch className={className} onClick={isMobile ? onToggleMobile : undefined}>
        {content}
      </Link>
    )
  }

  const panel = (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50/60 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a192f] text-xl font-black text-white shadow-lg">
            {brand?.logo_text || 'SA'}
          </div>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-sm font-black uppercase tracking-[0.22em] text-[#0f172a]">
              {brand?.firm_name?.split(' ')[0] || 'Senior'}
            </p>
            <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.28em] text-[#b8872f]">
              {brand?.firm_name?.split(' ').slice(1).join(' ') || 'Advocate'}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {navigation.map((item) => (
          <div key={`${item.name}-${item.href}`}>{renderNavItem(item)}</div>
        ))}
      </nav>

      <div className="border-t border-gray-200 bg-gray-50/60 p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#0a192f]">Contact</p>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a192f]/5 text-[#0f172a]">
                <Phone className="h-4 w-4" />
              </span>
              <a href={`tel:${contact?.phone || '+919876543210'}`} className="truncate font-semibold text-[#0f172a]">
                {contact?.phone || '+91 98765 43210'}
              </a>
            </div>
            {contact?.email && (
              <a href={`mailto:${contact.email}`} className="truncate rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700">
                {contact.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[320px] shrink-0 lg:block">
        {panel}
      </aside>

      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-3 py-3 sm:px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a192f] text-lg font-black text-white shadow-lg">
              {brand?.logo_text || 'SA'}
            </div>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-sm font-black uppercase tracking-[0.22em] text-[#0f172a]">
                {brand?.firm_name?.split(' ')[0] || 'Senior'}
              </p>
              <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.28em] text-[#b8872f]">
                {brand?.firm_name?.split(' ').slice(1).join(' ') || 'Advocate'}
              </p>
            </div>
          </Link>
          <button
            onClick={onToggleMobile}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-slate-500 transition-colors hover:text-[#0a192f]"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onToggleMobile}
          aria-label="Close navigation overlay"
        />
      )}

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {panel}
      </div>
    </>
  )
}
