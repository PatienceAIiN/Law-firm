import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// Razorpay → Server webhook. Configure the same RAZORPAY_WEBHOOK_SECRET in
// the Razorpay dashboard for EACH tenant's connected account. We use a
// platform-level secret because Razorpay sends one webhook per event; we
// route to the correct tenant via the order.notes.tenantSlug we set when
// creating the order.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: any
  try { event = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const type = event?.event as string
  const entity = event?.payload?.payment?.entity || event?.payload?.order?.entity || event?.payload?.refund?.entity
  const orderId: string | undefined = entity?.order_id || entity?.id

  if (!orderId) return NextResponse.json({ ok: true, ignored: true })

  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: orderId } })
  if (!payment) return NextResponse.json({ ok: true, missing: true })

  if (type === 'payment.captured' || type === 'payment.authorized') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: entity.id,
        paidAt: new Date(entity.created_at * 1000 || Date.now()),
      },
    })
  } else if (type === 'payment.failed') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: entity.error_description || entity.error_reason || 'Failed' },
    })
  } else if (type === 'refund.processed' || type === 'refund.created') {
    const refunded = (entity.amount || 0) / 100
    const total = payment.amount
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: refunded >= total ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundId: entity.id,
        refundedAmount: refunded,
        refundedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ok: true })
}
