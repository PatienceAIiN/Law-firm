import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { TenantReceiptsClient } from './receipts-client'
import { PaymentsHistory } from './payments-history'
import { listPaymentsForTenant } from '@/lib/payments'

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
      advocateId: true,
    },
  })
  // Single follow-up query to resolve advocate names for the chips — far
  // cheaper than includeing the relation on every row.
  const advocateIds = Array.from(new Set(receipts.map((r) => r.advocateId).filter(Boolean))) as string[]
  const advocates = advocateIds.length
    ? await prisma.advocate.findMany({ where: { id: { in: advocateIds }, tenantId: tenant.id }, select: { id: true, name: true } })
    : []
  const advocateName: Record<string, string> = Object.fromEntries(advocates.map((a) => [a.id, a.name]))
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  // Per-tenant payment history. The query is filtered by tenantId so one
  // workspace can NEVER see another's payments. Failures fall back to an
  // empty list (e.g. before the Payment migration runs).
  let payments: any[] = []
  try { payments = await listPaymentsForTenant(tenant.id, { take: 100 }) } catch (e) { console.warn('[receipts/page] payments query skipped:', (e as any)?.message) }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Receipts</h2>
      <TenantReceiptsClient
        slug={slug}
        receipts={receipts.map((r) => ({
          id: r.id, number: r.number, clientName: r.clientName, clientEmail: r.clientEmail,
          total: r.total, currency: r.currency, status: r.status,
          createdAt: r.createdAt.toISOString(),
          advocateId: r.advocateId,
          advocateName: r.advocateId ? advocateName[r.advocateId] || null : null,
        }))}
      />
      <PaymentsHistory
        slug={slug}
        payments={payments.map((p) => ({
          id: p.id, amount: p.amount, currency: p.currency, status: p.status, method: p.method,
          payerName: p.payerName, payerEmail: p.payerEmail, payerPhone: p.payerPhone,
          razorpayPaymentId: p.razorpayPaymentId, razorpayOrderId: p.razorpayOrderId,
          refundedAmount: p.refundedAmount, refundId: p.refundId,
          paidAt: p.paidAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          notes: p.notes,
          receiptId: p.receiptId,
        }))}
      />
    </TenantAdminShell>
  )
}
