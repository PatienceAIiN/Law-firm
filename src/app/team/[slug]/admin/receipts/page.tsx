import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { TenantReceiptsClient } from './receipts-client'

export const dynamic = 'force-dynamic'

export default async function TenantReceiptsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/admin/login`)

  // Use a typed SELECT so we never query the new `paymentMethod` column
  // before its migration has run on production — otherwise the whole page
  // crashes for tenants on the old schema.
  const receipts = await prisma.receipt.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, number: true, clientName: true, clientEmail: true,
      total: true, currency: true, status: true, createdAt: true,
    },
  })
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Receipts</h2>
      <TenantReceiptsClient
        slug={slug}
        receipts={receipts.map((r) => ({
          id: r.id, number: r.number, clientName: r.clientName, clientEmail: r.clientEmail,
          total: r.total, currency: r.currency, status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </TenantAdminShell>
  )
}
