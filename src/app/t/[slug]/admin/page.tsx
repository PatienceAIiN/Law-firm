import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { Briefcase, FileText, Users, Inbox, Gavel, ReceiptText, CalendarClock, UserPlus, Quote, ExternalLink } from 'lucide-react'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'

export const dynamic = 'force-dynamic'

const STAT_CARDS = (slug: string) => [
  { key: 'practice', label: 'Practice areas', icon: Briefcase, href: `/t/${slug}/admin/practice-areas` },
  { key: 'articles', label: 'Articles', icon: FileText, href: `/t/${slug}/admin/articles` },
  { key: 'lawyers', label: 'Lawyers', icon: Users, href: `/t/${slug}/admin/lawyers` },
  { key: 'cases', label: 'Cases', icon: Gavel, href: `/t/${slug}/admin/cases` },
  { key: 'inquiries', label: 'Inquiries', icon: Inbox, href: `/t/${slug}/admin/inquiries` },
  { key: 'receipts', label: 'Receipts', icon: ReceiptText, href: `/t/${slug}/admin/receipts` },
  { key: 'team', label: 'Team', icon: UserPlus, href: `/t/${slug}/admin/team` },
  { key: 'testimonials', label: 'Testimonials', icon: Quote, href: `/t/${slug}/admin/testimonials` },
  { key: 'availability', label: 'Availability', icon: CalendarClock, href: `/t/${slug}/admin/availability` },
] as const

export default async function TenantAdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const session = await getServerSession(tenantAdminAuthOptions)
  const sUser: any = session?.user
  if (!sUser?.id || sUser.tenantSlug !== tenant.slug) {
    redirect(`/t/${tenant.slug}/admin/login`)
  }

  const [practice, articles, lawyers, cases, inquiries, receipts, team, testimonials, availability] = await Promise.all([
    prisma.practiceArea.count({ where: { tenantId: tenant.id } }),
    prisma.blogPost.count({ where: { tenantId: tenant.id } }),
    prisma.advocate.count({ where: { tenantId: tenant.id } }),
    prisma.courtCase.count({ where: { tenantId: tenant.id } }),
    prisma.contactSubmission.count({ where: { tenantId: tenant.id } }),
    prisma.receipt.count({ where: { tenantId: tenant.id } }),
    prisma.teamMember.count({ where: { tenantId: tenant.id } }),
    prisma.testimonial.count({ where: { tenantId: tenant.id } }),
    prisma.availabilitySlot.count({ where: { day: { tenantId: tenant.id } } }),
  ])
  const counts = { practice, articles, lawyers, cases, inquiries, receipts, team, testimonials, availability } as Record<string, number>

  const currentUser = { id: sUser.id, name: session!.user!.name || sUser.email, email: sUser.email || '' }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS(tenant.slug).map((c) => {
          const Icon = c.icon
          return (
            <Link
              key={c.key}
              href={c.href}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#11151f]"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{c.label}</p>
                <p className="mt-1 text-3xl font-bold text-[#14203E] dark:text-white">{counts[c.key] ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14203E] text-white group-hover:bg-[#1d2c52]">
                <Icon className="h-5 w-5" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#14203E] dark:text-white">Your public site</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Share <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-white/10">/t/{tenant.slug}</code> with clients.
            </p>
          </div>
          <Link href={`/t/${tenant.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg bg-[#14203E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d2c52]">
            <ExternalLink className="h-3.5 w-3.5" /> Open site
          </Link>
        </div>
      </div>
    </TenantAdminShell>
  )
}
