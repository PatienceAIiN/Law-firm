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
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const receipts = await prisma.receipt.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-[#14203E] dark:text-white">Receipts</h2>
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
