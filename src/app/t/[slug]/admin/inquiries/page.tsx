import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'

export const dynamic = 'force-dynamic'

export default async function TenantInquiriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const items = await prisma.contactSubmission.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-[var(--primary)] dark:text-white">Inquiries</h2>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No inquiries from your site yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((i) => (
              <li key={i.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--primary)] dark:text-white">
                    {i.fullName} <span className="ml-2 text-xs font-normal text-slate-500">{i.email}</span>
                  </p>
                  <span className="text-xs text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">{i.subject}</p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{i.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TenantAdminShell>
  )
}
