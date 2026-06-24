'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Briefcase, FileText, Users, Inbox, Gavel, ReceiptText,
  CalendarClock, UserPlus, Quote, Mail, Settings, ExternalLink, LogOut, KeyRound, Shield, Package,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

type TenantInfo = { slug: string; name: string }
type CurrentUser = { id: string; name: string; email: string }

const TABS = (slug: string) => [
  { href: `/team/${slug}/admin`,                label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: `/team/${slug}/admin/practice-areas`, label: 'Practice',      icon: Briefcase },
  { href: `/team/${slug}/admin/articles`,       label: 'Articles',      icon: FileText },
  { href: `/team/${slug}/admin/lawyers`,        label: 'Lawyers',       icon: Users },
  { href: `/team/${slug}/admin/cases`,          label: 'Cases',         icon: Gavel },
  { href: `/team/${slug}/admin/availability`,   label: 'Availability',  icon: CalendarClock },
  { href: `/team/${slug}/admin/inquiries`,      label: 'Inquiries',     icon: Inbox },
  { href: `/team/${slug}/admin/receipts`,       label: 'Receipts',      icon: ReceiptText },
  { href: `/team/${slug}/admin/team`,           label: 'Team',          icon: UserPlus },
  { href: `/team/${slug}/admin/testimonials`,   label: 'Testimonials',  icon: Quote },
  { href: `/team/${slug}/admin/mail`,           label: 'Mail',          icon: Mail },
  { href: `/team/${slug}/admin/packages`,       label: 'Packages',      icon: Package },
  { href: `/team/${slug}/admin/branding`,       label: 'Branding',      icon: Settings },
  { href: `/team/${slug}/admin/legal`,          label: 'Legal',         icon: Shield },
  { href: `/team/${slug}/admin/account`,        label: 'Account',       icon: KeyRound },
]

export function TenantAdminShell({
  tenant,
  currentUser,
  children,
}: {
  tenant: TenantInfo
  currentUser: CurrentUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const tabs = TABS(tenant.slug)
  // Optimistic target — the tab the user just clicked. The highlight moves
  // instantly while Next routes; without this the click feels "stuck".
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [, startNav] = useTransition()
  const effectivePath = pendingHref || pathname

  useEffect(() => {
    // Clear the optimistic flag once the real URL catches up.
    if (pendingHref && pathname === pendingHref) setPendingHref(null)
  }, [pathname, pendingHref])

  useEffect(() => {
    // Warm every tab route on mount so the next click is instant. Cheap and
    // safe — Next dedupes prefetches and skips already-prefetched routes.
    tabs.forEach((t) => router.prefetch(t.href))
  }, [router, tabs])

  useEffect(() => {
    const currentTabs = TABS(tenant.slug)
    const activeTab = currentTabs.find((t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href)))
    const tabName = activeTab ? activeTab.label : 'Admin Portal'
    document.title = `${tabName} | Admin Portal | ${tenant.name}`
  }, [pathname, tenant.slug, tenant.name])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#11151f]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <Link href={`/team/${tenant.slug}/admin`} className="block">
              <h1 className="truncate text-base font-bold text-primary dark:text-white">{tenant.name}</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={`/team/${tenant.slug}`}
              target="_blank"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10 sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Site
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out?')) {
                  signOut({ callbackUrl: `/team/${tenant.slug}/admin/login` })
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>

        <nav className="relative border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e1219]">
          <TabsScroller>
            {tabs.map((t) => {
              const active = t.exact ? effectivePath === t.href : effectivePath.startsWith(t.href)
              const Icon = t.icon
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  prefetch={true}
                  onClick={(e) => {
                    // Optimistic active state — highlight moves the instant
                    // the user clicks, without waiting for the route swap.
                    if (active) return
                    e.preventDefault()
                    setPendingHref(t.href)
                    startNav(() => router.push(t.href))
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-primary text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </Link>
              )
            })}
          </TabsScroller>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}

function TabsScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hasLeft, setHasLeft] = useState(false)
  const [hasRight, setHasRight] = useState(false)

  const update = () => {
    const el = ref.current
    if (!el) return
    setHasLeft(el.scrollLeft > 4)
    setHasRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const nudge = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Scroll tabs left"
        onClick={() => nudge(-1)}
        className={`absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1 text-primary shadow ring-1 ring-slate-200 transition-opacity duration-200 hover:bg-slate-50 dark:bg-[#11151f] dark:text-white dark:ring-white/15 ${hasLeft ? 'opacity-100 animate-pulse' : 'pointer-events-none opacity-0'}`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div
        ref={ref}
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto scroll-smooth px-8 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Scroll tabs right"
        onClick={() => nudge(1)}
        className={`absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1 text-primary shadow ring-1 ring-slate-200 transition-opacity duration-200 hover:bg-slate-50 dark:bg-[#11151f] dark:text-white dark:ring-white/15 ${hasRight ? 'opacity-100 animate-pulse' : 'pointer-events-none opacity-0'}`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
