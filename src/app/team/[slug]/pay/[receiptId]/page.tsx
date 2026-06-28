import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTenantBySlug } from '@/lib/tenant'
import { getPaymentConfig, buildUpiUrl, buildUpiQrDataUrl } from '@/lib/payments'
import { PayClientForm } from './pay-client-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pay receipt' }

export default async function PayReceiptPage({ params }: { params: Promise<{ slug: string; receiptId: string }> }) {
  const { slug, receiptId } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const receipt = await prisma.receipt.findFirst({ where: { id: receiptId, tenantId: tenant.id } })
  if (!receipt) notFound()

  const cfg = await getPaymentConfig(tenant.id)
  let qrDataUrl: string | null = null
  if ((receipt.paymentMethod || 'UPI').toUpperCase() === 'UPI' && cfg.upiVpa) {
    const url = buildUpiUrl({
      vpa: cfg.upiVpa,
      payeeName: cfg.upiName,
      amount: receipt.total,
      referenceId: receipt.number,
      note: `Receipt ${receipt.number}`,
      currency: receipt.currency,
    })
    qrDataUrl = await buildUpiQrDataUrl(url).catch(() => null)
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold text-primary dark:text-white">Pay receipt {receipt.number}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{receipt.currency} {receipt.total.toFixed(2)} · {receipt.clientName}</p>

      {qrDataUrl && (
        <div className="mt-5 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#11151f]">
          <img src={qrDataUrl} alt="UPI QR" className="h-56 w-56" />
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Scan with any UPI app · {cfg.upiVpa}{cfg.upiName ? ` · ${cfg.upiName}` : ''}
          </p>
        </div>
      )}
      {!qrDataUrl && cfg.bankAccountNumber && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-white/10 dark:bg-[#11151f]">
          <p className="font-semibold">Bank transfer</p>
          {cfg.bankAccountHolder && <p>Account name: {cfg.bankAccountHolder}</p>}
          {cfg.bankName && <p>Bank: {cfg.bankName}</p>}
          <p>A/C: {cfg.bankAccountNumber}</p>
          {cfg.bankIfsc && <p>IFSC: {cfg.bankIfsc}</p>}
        </div>
      )}

      <PayClientForm
        slug={slug}
        receiptId={receipt.id}
        amount={receipt.total}
        currency={receipt.currency}
        razorpayEnabled={!!cfg.razorpayKeyId && cfg.enabled !== false}
        razorpayKeyId={cfg.razorpayKeyId || ''}
        payerName={receipt.clientName}
        payerEmail={receipt.clientEmail}
      />
    </div>
  )
}
