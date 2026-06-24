import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentConfig, verifyRazorpaySignature } from '@/lib/payments'
import { getTenantBySlug } from '@/lib/tenant'
import { emailReceipt } from '@/lib/receipts'

export const dynamic = 'force-dynamic'

// Called by the client after Razorpay redirects/closes successfully. We
// verify the signature server-side (defence in depth) BEFORE marking the
// payment complete and triggering the success email.
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { tenantSlug, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {}
  if (!tenantSlug || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const cfg = await getPaymentConfig(tenant.id)
  if (!cfg.razorpayKeySecret) return NextResponse.json({ error: 'Workspace has no Razorpay key configured' }, { status: 412 })

  const valid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    cfg.razorpayKeySecret,
  )
  if (!valid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })

  // Locate the payment row we created during create-order. Scoped by
  // tenantId — a tenant cannot complete another tenant's order.
  const payment = await prisma.payment.findFirst({
    where: { tenantId: tenant.id, razorpayOrderId: razorpay_order_id },
  })
  if (!payment) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paidAt: new Date(),
    },
  })

  // ONLY after the signature is verified do we mark the receipt sent and
  // email the success copy to the payer. No "trust the client" path.
  if (payment.receiptId) {
    try {
      const receipt = await prisma.receipt.update({
        where: { id: payment.receiptId },
        data: { status: 'PAID', sentAt: new Date() },
      })
      await emailReceipt(receipt).catch((e) => console.error('[payments/verify] receipt email failed', e))
    } catch (e) {
      console.error('[payments/verify] receipt update failed', e)
    }
  }

  return NextResponse.json({ ok: true, payment: updated })
}
