'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Briefcase, FileText, Users, Inbox, Gavel, ReceiptText,
  CalendarClock, UserPlus, Quote, Mail, Settings, ExternalLink, LogOut, KeyRound, Shield, Package,
  Menu, X,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { useUnreadCounts } from '@/hooks/use-unread-counts'

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
  { href: `/team/${slug}/admin/chats`,          label: 'Chats',         icon: Mail },
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
  const tabs = useMemo(() => TABS(tenant.slug), [tenant.slug])
  const [mobileOpen, setMobileOpen] = useState(false)
  const unread = useUnreadCounts()

  // Optimistic skeleton swap: the instant a non-active tab is clicked we
  // show the destination skeleton in the main area. Cleared the moment
  // pathname catches up OR after a 4-second safety timeout (so a stalled
  // dev compile never leaves it stuck).
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  useEffect(() => { setPendingHref(null) }, [pathname])
  useEffect(() => {
    if (!pendingHref) return
    const t = setTimeout(() => setPendingHref(null), 4000)
    return () => clearTimeout(t)
  }, [pendingHref])
  const badgeFor = (href: string): number => {
    if (href.endsWith('/inquiries')) return unread.inquiries
    if (href.endsWith('/receipts')) return unread.payments + unread.receipts
    if (href.endsWith('/mail')) return unread.mail
    return 0
  }

  const activePath = pendingHref || pathname

  // Prefetch every route once per workspace mount.
  const prefetchedRef = useRef<string | null>(null)
  useEffect(() => {
    if (prefetchedRef.current === tenant.slug) return
    prefetchedRef.current = tenant.slug
    tabs.forEach((t) => router.prefetch(t.href))
  }, [tabs, router, tenant.slug])

  useEffect(() => {
    const activeTab = tabs.find((t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href)))
    document.title = `${activeTab ? activeTab.label : 'Admin'} | ${tenant.name}`
  }, [pathname, tabs, tenant.name])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0f17] dark:text-slate-100">
      {/* MOBILE TOPBAR */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden dark:border-white/10 dark:bg-[#11151f]/95">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-sm font-bold text-primary dark:text-white">{tenant.name}</h1>
        <ThemeToggle />
      </header>

      {/* SIDEBAR — desktop fixed left; mobile slide-over */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out dark:border-white/10 dark:bg-[#11151f] md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <Link href={`/team/${tenant.slug}/admin`} className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-primary dark:text-white">{tenant.name}</h1>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TABS — single flex column, no overflow horizontal, native-fast Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:thin]">
          <ul className="space-y-0.5">
            {tabs.map((t) => {
              const active = t.exact ? activePath === t.href : activePath.startsWith(t.href)
              const Icon = t.icon
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    prefetch={true}
                    onPointerDown={() => { if (!active) setPendingHref(t.href) }}
                    className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-75 active:scale-[0.99] ${
                      active
                        ? 'bg-primary text-white shadow-sm shadow-[#14203E]/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-amber-300' : ''}`} />
                    <span className="flex-1 truncate">{t.label}</span>
                    {badgeFor(t.href) > 0 && (
                      <span className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-amber-300 text-primary' : 'bg-rose-500 text-white'}`}>
                        {badgeFor(t.href) > 99 ? '99+' : badgeFor(t.href)}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="space-y-1 border-t border-slate-200 px-2 py-3 dark:border-white/10">
          <Link
            href={`/team/${tenant.slug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[11px] uppercase tracking-widest text-slate-400">Theme</span>
            <ThemeToggle />
          </div>
          <button
            onClick={async () => {
              if (await confirmDialog({ title: 'Log out?', message: 'You will be signed out of this admin workspace.', confirmLabel: 'Log out' })) {
                signOut({ callbackUrl: `/team/${tenant.slug}/admin/login` })
              }
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-900/20 dark:text-rose-200 dark:hover:bg-rose-900/30"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="px-4 py-6 md:ml-64 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          {pendingHref ? <NavSkeleton /> : children}
        </div>
      </main>
    </div>
  )
}

function NavSkeleton() {
  // Renders the instant the user clicks a side-nav button. Replaces the
  // page content with a shimmer block so the click feels native-fast even
  // when the destination route is still streaming / compiling.
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-white/10" />
      <div className="h-4 w-72 rounded bg-slate-100 dark:bg-white/5" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#11151f]">
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-3 h-3 w-2/3 rounded bg-slate-100 dark:bg-white/5" />
            <div className="mt-2 h-3 w-3/4 rounded bg-slate-100 dark:bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
