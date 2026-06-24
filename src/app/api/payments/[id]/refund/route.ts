import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'
import { getPaymentConfig, razorpayClientFor } from '@/lib/payments'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payment = await prisma.payment.findUnique({ where: { id } })
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  if (payment.tenantId !== u.tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (payment.status !== 'COMPLETED' && payment.status !== 'PARTIALLY_REFUNDED') {
    return NextResponse.json({ error: 'Only completed payments can be refunded' }, { status: 400 })
  }

  let body: any = {}
  try { body = await req.json() } catch {}
  const requestedAmount = Number(body?.amount)
  const refundAmount = requestedAmount && requestedAmount > 0
    ? Math.min(requestedAmount, payment.amount - payment.refundedAmount)
    : (payment.amount - payment.refundedAmount)

  if (refundAmount <= 0) return NextResponse.json({ error: 'Nothing left to refund' }, { status: 400 })

  const cfg = await getPaymentConfig(payment.tenantId)
  const rzp = razorpayClientFor(cfg)
  if (!rzp || !payment.razorpayPaymentId) {
    return NextResponse.json({ error: 'Cannot refund — Razorpay not configured or no payment id' }, { status: 412 })
  }

  try {
    const refund = await rzp.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
      notes: { reason: body?.reason || 'Admin-initiated refund' },
    })

    const totalRefunded = payment.refundedAmount + refundAmount
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: totalRefunded >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundId: refund.id,
        refundedAmount: totalRefunded,
        refundedAt: new Date(),
      },
    })
    return NextResponse.json({ ok: true, payment: updated })
  } catch (e: any) {
    console.error('[payments/refund]', e)
    return NextResponse.json({ error: e?.error?.description || e?.message || 'Refund failed' }, { status: 500 })
  }
}
