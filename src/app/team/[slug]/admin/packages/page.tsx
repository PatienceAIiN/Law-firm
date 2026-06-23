import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { PackagesClient } from './packages-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  return { title: `Packages — ${tenant?.name || slug}` }
}

const PORTAL_FEATURES = (slug: string) => [
  { key: 'home', icon: '🏠', label: 'Public site', href: `/team/${slug}`, body: 'The marketing front page for the firm.', audience: ['public'] },
  { key: 'practice', icon: '⚖️', label: 'Practice areas', href: `/team/${slug}/practice-areas`, body: 'Every area you handle, public.', audience: ['public'] },
  { key: 'team', icon: '👥', label: 'Team page', href: `/team/${slug}/team`, body: 'Meet the lawyers + testimonials.', audience: ['public'] },
  { key: 'articles', icon: '📝', label: 'Articles', href: `/team/${slug}/articles`, body: 'Long-form posts.', audience: ['public'] },
  { key: 'book', icon: '📅', label: 'Book a consult', href: `/team/${slug}/book`, body: 'Slot booking with in-person + virtual modes.', audience: ['public'] },
  { key: 'contact', icon: '✉️', label: 'Contact page', href: `/team/${slug}/contact`, body: 'Inquiry form → lands in admin Inquiries.', audience: ['public'] },
  { key: 'admin', icon: '🛠️', label: 'Admin login', href: `/team/${slug}/admin/login`, body: 'Owner / admin authentication.', audience: ['admin'] },
  { key: 'admin-dashboard', icon: '📊', label: 'Admin dashboard', href: `/team/${slug}/admin`, body: 'Overview + counts for every section.', audience: ['admin'] },
  { key: 'admin-cases', icon: '⚖️', label: 'Cases', href: `/team/${slug}/admin/cases`, body: 'Manage court cases + assign to lawyers.', audience: ['admin'] },
  { key: 'admin-availability', icon: '📆', label: 'Availability', href: `/team/${slug}/admin/availability`, body: 'Slots clients can book.', audience: ['admin'] },
  { key: 'admin-receipts', icon: '🧾', label: 'Receipts', href: `/team/${slug}/admin/receipts`, body: 'Multi-line invoices + email PDF.', audience: ['admin'] },
  { key: 'admin-mail', icon: '✉️', label: 'Mail (Gmail)', href: `/team/${slug}/admin/mail`, body: 'Read + reply in workspace.', audience: ['admin'] },
  { key: 'admin-branding', icon: '🎨', label: 'Branding', href: `/team/${slug}/admin/branding`, body: 'Colors, logo, favicon, home cover.', audience: ['admin'] },
  { key: 'admin-legal', icon: '📜', label: 'Legal pages', href: `/team/${slug}/admin/legal`, body: 'Rich-text Terms + Privacy editor.', audience: ['admin'] },
  { key: 'lawyer', icon: '👨‍⚖️', label: 'Lawyer login', href: `/team/${slug}/lawyer/login`, body: 'Lawyer authentication.', audience: ['lawyer'] },
  { key: 'lawyer-dashboard', icon: '🗂️', label: 'Lawyer dashboard', href: `/team/${slug}/lawyer`, body: 'My cases, mail, instant meetings.', audience: ['lawyer'] },
]

export default async function TenantPackagesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/admin/login`)

  const [admins, advocates] = await Promise.all([
    prisma.adminUser.findMany({ where: { tenantId: tenant.id }, select: { id: true, name: true, email: true } }),
    prisma.advocate.findMany({ where: { tenantId: tenant.id, isActive: true }, select: { id: true, name: true, email: true } }),
  ])

  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
  const features = PORTAL_FEATURES(slug).map((f) => ({ ...f, url: `${base}${f.href}` }))

  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-2 text-xl font-bold text-primary dark:text-white">Workspace packages</h2>
      <p className="mb-4 text-sm text-slate-500">Every page available in your workspace. Select rows then share by email to your team or lawyers.</p>
      <PackagesClient
        slug={slug}
        features={features}
        people={[
          ...admins.map((a) => ({ id: `admin-${a.id}`, kind: 'admin' as const, name: a.name, email: a.email })),
          ...advocates.map((a) => ({ id: `adv-${a.id}`, kind: 'lawyer' as const, name: a.name, email: a.email })),
        ]}
      />
    </TenantAdminShell>
  )
}
