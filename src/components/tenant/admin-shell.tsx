'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Briefcase, FileText, Users, Inbox, Gavel, ReceiptText,
  CalendarClock, UserPlus, Quote, Mail, Settings, ExternalLink, LogOut,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

type TenantInfo = { slug: string; name: string }
type CurrentUser = { id: string; name: string; email: string }

const TABS = (slug: string) => [
  { href: `/t/${slug}/admin`,                label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: `/t/${slug}/admin/practice-areas`, label: 'Practice',      icon: Briefcase },
  { href: `/t/${slug}/admin/articles`,       label: 'Articles',      icon: FileText },
  { href: `/t/${slug}/admin/lawyers`,        label: 'Lawyers',       icon: Users },
  { href: `/t/${slug}/admin/cases`,          label: 'Cases',         icon: Gavel },
  { href: `/t/${slug}/admin/availability`,   label: 'Availability',  icon: CalendarClock },
  { href: `/t/${slug}/admin/inquiries`,      label: 'Inquiries',     icon: Inbox },
  { href: `/t/${slug}/admin/receipts`,       label: 'Receipts',      icon: ReceiptText },
  { href: `/t/${slug}/admin/team`,           label: 'Team',          icon: UserPlus },
  { href: `/t/${slug}/admin/testimonials`,   label: 'Testimonials',  icon: Quote },
  { href: `/t/${slug}/admin/mail`,           label: 'Mail',          icon: Mail },
  { href: `/t/${slug}/admin/branding`,       label: 'Branding',      icon: Settings },
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
  const tabs = TABS(tenant.slug)

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
            <Link href={`/t/${tenant.slug}/admin`} className="block">
              <h1 className="truncate text-base font-bold text-[var(--primary)] dark:text-white">{tenant.name}</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={`/t/${tenant.slug}`}
              target="_blank"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10 sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Site
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out?')) {
                  signOut({ callbackUrl: `/t/${tenant.slug}/admin/login` })
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>

        <nav className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e1219]">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => {
              const active = t.exact ? pathname === t.href : pathname.startsWith(t.href)
              const Icon = t.icon
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  prefetch={true}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-[var(--primary)] text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[var(--primary)] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
