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

  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  // Each chunk is wrapped — any single failure leaves the others intact and
  // never 500s the whole route. This is what made the previous build of
  // /receipts crash for tenants on the pre-Payment schema.
  let receipts: any[] = []
  try {
    receipts = await prisma.receipt.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true, number: true, clientName: true, clientEmail: true,
        total: true, currency: true, status: true, createdAt: true,
        advocateId: true, caseNumber: true,
      },
    })
  } catch (e) { console.error('[receipts/page] receipts query failed:', (e as any)?.message) }

  // Single follow-up query to resolve advocate names for the chips — far
  // cheaper than includeing the relation on every row.
  const advocateIds = Array.from(new Set(receipts.map((r: any) => r.advocateId).filter(Boolean))) as string[]
  let advocateName: Record<string, string> = {}
  try {
    if (advocateIds.length) {
      const advocates = await prisma.advocate.findMany({
        where: { id: { in: advocateIds }, tenantId: tenant.id },
        select: { id: true, name: true },
      })
      advocateName = Object.fromEntries(advocates.map((a) => [a.id, a.name]))
    }
  } catch (e) { console.warn('[receipts/page] advocate lookup skipped:', (e as any)?.message) }

  // Per-tenant payment history. listPaymentsForTenant already swallows
  // table-missing errors. Wrapped again here for full safety.
  let payments: any[] = []
  try { payments = await listPaymentsForTenant(tenant.id, { take: 100 }) } catch (e) { console.warn('[receipts/page] payments skipped:', (e as any)?.message) }

  // FIRM-WIDE case dropdown — admin can attach any case in the workspace.
  let cases: any[] = []
  try {
    cases = await prisma.courtCase.findMany({
      where: { tenantId: tenant.id, status: { in: ['ACTIVE', 'PENDING', 'ADJOURNED'] } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, caseNumber: true, title: true, clientName: true, clientEmail: true, advocateId: true },
      take: 500,
    })
  } catch (e) { console.warn('[receipts/page] cases skipped:', (e as any)?.message) }
  // Attach the lawyer name to each case so the dropdown can show it.
  const caseAdvIds = Array.from(new Set(cases.map((c: any) => c.advocateId).filter(Boolean))) as string[]
  const caseAdvocates = caseAdvIds.length
    ? await prisma.advocate.findMany({ where: { id: { in: caseAdvIds }, tenantId: tenant.id }, select: { id: true, name: true } }).catch(() => [])
    : []
  const caseAdvocateName: Record<string, string> = Object.fromEntries(caseAdvocates.map((a: any) => [a.id, a.name]))

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Receipts</h2>
      <TenantReceiptsClient
        slug={slug}
        cases={cases.map((c: any) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          title: c.title,
          clientName: c.clientName,
          clientEmail: c.clientEmail,
          advocateName: c.advocateId ? caseAdvocateName[c.advocateId] || null : null,
        }))}
        receipts={receipts.map((r) => ({
          id: r.id, number: r.number, clientName: r.clientName, clientEmail: r.clientEmail,
          total: r.total, currency: r.currency, status: r.status,
          createdAt: r.createdAt.toISOString(),
          advocateId: r.advocateId, caseNumber: r.caseNumber,
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
          transactionNumber: (p as any).transactionNumber || null,
          screenshotUrl: (p as any).screenshotUrl || null,
          verificationRequired: !!(p as any).verificationRequired,
          statusUpdatedByName: (p as any).statusUpdatedByName || null,
        }))}
      />
    </TenantAdminShell>
  )
}
