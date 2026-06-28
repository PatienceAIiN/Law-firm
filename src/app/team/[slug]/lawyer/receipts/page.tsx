import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { LawyerReceiptsClient } from './lawyer-receipts-client'
import { LawyerPaymentsHistory } from './lawyer-payments-history'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Receipts' }

export default async function LawyerReceiptsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/lawyer/login`)

  const advocateId = u.id as string

  // EVERY query is wrapped — pre-migration tenants don't 500. Scoped to
  // (tenantId, advocateId) so one lawyer can't see another's data.
  let cases: any[] = []
  let receiptRows: any[] = []
  let advocate: { id: string; name: string; email: string } | null = null
  try {
    cases = await prisma.courtCase.findMany({
      where: { tenantId: tenant.id, advocateId, status: { in: ['ACTIVE', 'PENDING', 'ADJOURNED'] } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, caseNumber: true, title: true, clientName: true, clientEmail: true, clientPhone: true, status: true },
      take: 200,
    })
  } catch (e) { console.warn('[lawyer/receipts] cases skipped:', (e as any)?.message) }
  try {
    receiptRows = await prisma.receipt.findMany({
      where: { tenantId: tenant.id, advocateId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true, number: true, clientName: true, clientEmail: true,
        total: true, currency: true, status: true, createdAt: true, caseNumber: true,
      },
    })
  } catch (e) { console.warn('[lawyer/receipts] receipts skipped:', (e as any)?.message) }
  try {
    advocate = await prisma.advocate.findUnique({ where: { id: advocateId }, select: { id: true, name: true, email: true } })
  } catch (e) { console.warn('[lawyer/receipts] advocate lookup skipped:', (e as any)?.message) }

  let payments: any[] = []
  try {
    payments = await prisma.payment.findMany({
      where: { tenantId: tenant.id, advocateId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  } catch (e) { console.warn('[lawyer/receipts] payments skipped:', (e as any)?.message) }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-primary dark:text-white">Receipts</h1>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {advocate?.name || 'You'} only
        </span>
      </div>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Your receipts and payments only. Other lawyers in this firm cannot see anything below.
      </p>

      <LawyerReceiptsClient
        slug={slug}
        cases={cases}
        receipts={receiptRows.map((r) => ({
          id: r.id, number: r.number, clientName: r.clientName, clientEmail: r.clientEmail,
          total: r.total, currency: r.currency, status: r.status,
          createdAt: r.createdAt.toISOString(), caseNumber: r.caseNumber,
        }))}
      />

      <LawyerPaymentsHistory
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
          utr: (p as any).utr || null,
          proofUrl: (p as any).proofUrl || null,
          approvedByName: (p as any).approvedByName || null,
          approvedByRole: (p as any).approvedByRole || null,
        }))}
      />
    </div>
  )
}
