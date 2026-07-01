import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentConfig, razorpayClientFor, recordPayment } from '@/lib/payments'
import { getTenantBySlug } from '@/lib/tenant'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Create a Razorpay order scoped to a specific tenant. The tenant's OWN
// Razorpay keys are used, so the money lands in their bank account — never
// in a shared platform account.
export async function POST(req: NextRequest) {
  const rl = await rateLimit(`create-order:${clientIp(req)}`, 20, 3600)
  if (!rl.ok) return NextResponse.json({ error: 'Too many payment attempts. Try again later.' }, { status: 429 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { tenantSlug, receiptId, amount, currency, payerName, payerEmail, payerPhone, notes } = body || {}
  if (!tenantSlug) return NextResponse.json({ error: 'tenantSlug required' }, { status: 400 })
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'amount must be > 0' }, { status: 400 })
  }

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  let receiptAdvocateId: string | null = null
  if (receiptId) {
    const r = await prisma.receipt.findFirst({ where: { id: receiptId, tenantId: tenant.id } })
    if (!r) return NextResponse.json({ error: 'Receipt not in this workspace' }, { status: 403 })
    receiptAdvocateId = r.advocateId
  }

  const cfg = await getPaymentConfig(tenant.id)
  const rzp = razorpayClientFor(cfg)
  if (!rzp) {
    return NextResponse.json({ error: 'This workspace has not configured Razorpay yet.' }, { status: 412 })
  }

  // Razorpay amounts are in the smallest unit (paise).
  const amountPaise = Math.round(Number(amount) * 100)

  try {
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: (currency || 'INR').toUpperCase(),
      receipt: receiptId ? `rcpt_${receiptId.slice(0, 30)}` : undefined,
      notes: {
        tenantSlug,
        receiptId: receiptId || '',
        payerEmail: payerEmail || '',
      },
    })

    await recordPayment({
      tenantId: tenant.id,
      receiptId: receiptId || undefined,
      advocateId: receiptAdvocateId,
      amount: Number(amount),
      method: 'RAZORPAY',
      razorpayOrderId: order.id,
      payerName, payerEmail, payerPhone,
      notes,
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: cfg.razorpayKeyId, // safe — public key
    })
  } catch (e: any) {
    console.error('[payments/create-order]', e)
    return NextResponse.json({ error: e?.error?.description || e?.message || 'Failed to create order' }, { status: 500 })
  }
}
