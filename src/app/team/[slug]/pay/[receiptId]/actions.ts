'use server'

import { prisma } from '@/lib/prisma'
import { getTenantBySlug } from '@/lib/tenant'
import { sendEmail } from '@/lib/email'

export async function submitClientPayment(
  slug: string,
  receiptId: string,
  payload: { utr: string; payerName?: string; payerPhone?: string; proofUrl?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) return { ok: false, error: 'Workspace not found' }
    const receipt = await prisma.receipt.findFirst({ where: { id: receiptId, tenantId: tenant.id } })
    if (!receipt) return { ok: false, error: 'Receipt not found' }

    const data: any = {
      tenantId: tenant.id,
      receiptId: receipt.id,
      advocateId: receipt.advocateId || undefined,
      amount: receipt.total,
      currency: receipt.currency,
      method: (receipt.paymentMethod || 'OTHER').toUpperCase(),
      // AWAITING_REVIEW = client submitted; needs admin/lawyer to verify.
      status: 'AWAITING_REVIEW',
      payerName: payload.payerName || receipt.clientName,
      payerEmail: receipt.clientEmail,
      payerPhone: payload.payerPhone,
      utr: payload.utr,
      proofUrl: payload.proofUrl || null,
      notes: `UTR: ${payload.utr}${payload.proofUrl ? ' | Proof attached' : ''}`,
    }
    try { await prisma.payment.create({ data }) }
    catch (e: any) {
      if (/utr|proofUrl|approvedBy/i.test(String(e?.message))) {
        // Pre-migration fallback: drop the new columns.
        delete data.utr; delete data.proofUrl
        data.status = 'PENDING'
        await prisma.payment.create({ data })
      } else throw e
    }

    // Notify the firm so they can verify quickly.
    sendEmail({
      to: tenant.ownerEmail,
      subject: `Client confirmed payment — receipt ${receipt.number}`,
      htmlContent: `<p>${receipt.clientName} submitted UTR <strong>${payload.utr}</strong> for receipt ${receipt.number} (${receipt.currency} ${receipt.total.toFixed(2)}).</p><p>Verify and mark complete in the Receipts → Payment history panel.</p>`,
      textContent: `Client UTR ${payload.utr} for receipt ${receipt.number}`,
    }).catch(() => {})

    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not submit' }
  }
}
