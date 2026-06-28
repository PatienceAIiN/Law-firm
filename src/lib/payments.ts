import crypto from 'crypto'
import { prisma } from './prisma'
import { getTenantSettingJson, setTenantSettingJson } from './tenant-settings'

// Lazy-load razorpay + qrcode so importing this module from a page bundle
// doesn't pull in node-only deps at route-init time. A broken require here
// (CJS interop on some hosts) was crashing the admin/receipts page with a
// generic "Server Components render" 500.
type RazorpayType = any
let _RazorpayCtor: RazorpayType | null = null
function getRazorpayCtor(): RazorpayType | null {
  if (_RazorpayCtor) return _RazorpayCtor
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('razorpay')
    _RazorpayCtor = mod.default || mod
    return _RazorpayCtor
  } catch (e) {
    console.warn('[payments] razorpay sdk unavailable:', (e as any)?.message)
    return null
  }
}

async function getQRCode(): Promise<any | null> {
  try { return (await import('qrcode')).default || (await import('qrcode')) } catch (e) {
    console.warn('[payments] qrcode sdk unavailable:', (e as any)?.message)
    return null
  }
}

export type PaymentConfig = {
  razorpayKeyId?: string
  razorpayKeySecret?: string
  upiVpa?: string          // e.g. "harshlaw@oksbi"
  upiName?: string         // payee name shown in UPI apps
  bankAccountHolder?: string
  bankAccountNumber?: string
  bankIfsc?: string
  bankName?: string
  enabled?: boolean
}

const SETTINGS_KEY = 'payments_config'

export async function getPaymentConfig(tenantId: string): Promise<PaymentConfig> {
  const cfg = (await getTenantSettingJson<PaymentConfig>(tenantId, SETTINGS_KEY)) || {}
  return cfg
}

export async function setPaymentConfig(tenantId: string, patch: Partial<PaymentConfig>) {
  const existing = await getPaymentConfig(tenantId)
  const merged = { ...existing, ...patch }
  await setTenantSettingJson(tenantId, SETTINGS_KEY, merged)
  return merged
}

/**
 * Build a Razorpay client using the TENANT'S OWN keys. We never read
 * platform-wide keys for collecting money — every workspace pays into its
 * own connected account.
 */
export function razorpayClientFor(cfg: PaymentConfig): any | null {
  if (!cfg?.razorpayKeyId || !cfg?.razorpayKeySecret) return null
  const Ctor = getRazorpayCtor()
  if (!Ctor) return null
  return new Ctor({
    key_id: cfg.razorpayKeyId,
    key_secret: cfg.razorpayKeySecret,
  })
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  // timingSafeEqual throws on length mismatch; guard so a malformed
  // signature returns false instead of crashing the verify endpoint.
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(signature, 'utf8')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

/**
 * Build a UPI deep-link URL (`upi://pay?...`). When rendered as a QR code
 * any Indian UPI app (GPay, PhonePe, Paytm, BHIM) recognizes it.
 */
export function buildUpiUrl(opts: {
  vpa: string
  payeeName?: string
  amount: number
  note?: string
  referenceId?: string
  currency?: string
}) {
  const params = new URLSearchParams()
  params.set('pa', opts.vpa)
  if (opts.payeeName) params.set('pn', opts.payeeName)
  params.set('am', opts.amount.toFixed(2))
  params.set('cu', (opts.currency || 'INR').toUpperCase())
  if (opts.referenceId) params.set('tr', opts.referenceId.slice(0, 35))
  if (opts.note) params.set('tn', opts.note.slice(0, 80))
  return `upi://pay?${params.toString()}`
}

export async function buildUpiQrPng(url: string): Promise<Buffer | null> {
  const QRCode = await getQRCode()
  if (!QRCode) return null
  return QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 360,
    color: { dark: '#14203E', light: '#FFFFFF' },
  })
}

export async function buildUpiQrDataUrl(url: string): Promise<string | null> {
  const QRCode = await getQRCode()
  if (!QRCode) return null
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 360,
    color: { dark: '#14203E', light: '#FFFFFF' },
  })
}

export async function listPaymentsForTenant(tenantId: string, opts?: { receiptId?: string; status?: string; take?: number; advocateId?: string }) {
  // Defensive: if the Payment table hasn't been migrated yet, return [].
  try {
    return await prisma.payment.findMany({
      where: {
        tenantId,
        ...(opts?.receiptId ? { receiptId: opts.receiptId } : {}),
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.advocateId ? { advocateId: opts.advocateId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: opts?.take || 100,
    })
  } catch (e) {
    console.warn('[listPaymentsForTenant] payments table unavailable:', (e as any)?.message)
    return []
  }
}

export async function recordPayment(args: {
  tenantId: string
  receiptId?: string
  advocateId?: string | null
  amount: number
  method: string
  razorpayOrderId?: string
  payerName?: string
  payerEmail?: string
  payerPhone?: string
  notes?: string
}) {
  return prisma.payment.create({
    data: {
      tenantId: args.tenantId,
      receiptId: args.receiptId,
      advocateId: args.advocateId || undefined,
      amount: args.amount,
      method: args.method,
      razorpayOrderId: args.razorpayOrderId,
      payerName: args.payerName,
      payerEmail: args.payerEmail,
      payerPhone: args.payerPhone,
      notes: args.notes,
      status: 'PENDING',
    },
  })
}
