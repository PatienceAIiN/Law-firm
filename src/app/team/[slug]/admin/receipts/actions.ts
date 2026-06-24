'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'
import { emailReceipt } from '@/lib/receipts'

async function authed(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string, name: (session!.user!.name || (u.email as string)) as string }
}

function nextReceiptNumber(tenantId: string) {
  return `R-${tenantId.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
}

export async function createReceipt(
  slug: string,
  formData: FormData,
): Promise<{ ok: true; receiptId: string } | { ok: false; error: string }> {
 try {
  const { tenantId, name: createdByName } = await authed(slug)
  const clientName = (formData.get('clientName') as string)?.trim()
  const clientEmailRaw = (formData.get('clientEmail') as string)?.trim() || ''
  const paymentMethodRaw = ((formData.get('paymentMethod') as string) || 'OTHER').toUpperCase()
  const paymentMethod = ['UPI', 'NEFT', 'CASH', 'OTHER'].includes(paymentMethodRaw) ? paymentMethodRaw : 'OTHER'
  const caseId = ((formData.get('caseId') as string) || '').trim() || null

  // Admin can link ANY case in the firm (not lawyer-scoped). Still tenantId-
  // scoped so one workspace can't link another's case.
  let caseSnap: { caseNumber: string; title: string; advocateId: string | null } | null = null
  if (caseId) {
    const c = await prisma.courtCase.findFirst({
      where: { id: caseId, tenantId },
      select: { caseNumber: true, title: true, advocateId: true },
    })
    if (!c) return { ok: false, error: 'That case is not in this workspace.' }
    caseSnap = c
  }

  // Prefer the new multi-line JSON payload; fall back to single description+amount.
  let lines: { description: string; qty: number; rate: number }[] = []
  const itemsJson = (formData.get('itemsJson') as string) || ''
  if (itemsJson) {
    try {
      const parsed = JSON.parse(itemsJson)
      if (Array.isArray(parsed)) {
        lines = parsed
          .map((it: any) => ({
            description: String(it?.description || '').trim() || 'Item',
            qty: Math.max(0, Number(it?.qty) || 0),
            rate: Math.max(0, Number(it?.rate) || 0),
          }))
          .filter((it) => it.qty > 0 && it.rate > 0)
      }
    } catch {}
  }
  if (lines.length === 0) {
    const description = (formData.get('description') as string)?.trim() || 'Legal services'
    const amount = parseFloat((formData.get('amount') as string) || '0')
    if (!amount || isNaN(amount) || amount <= 0) return { ok: false, error: 'Add at least one line item with a positive amount.' }
    lines = [{ description, qty: 1, rate: amount }]
  }
  if (!clientName) return { ok: false, error: 'Client name is required' }
  if (clientEmailRaw && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmailRaw)) {
    return { ok: false, error: 'Enter a valid client email or leave it blank' }
  }

  const enriched = lines.map((l) => ({ ...l, amount: +(l.qty * l.rate).toFixed(2) }))
  const subtotal = +enriched.reduce((s, l) => s + l.amount, 0).toFixed(2)
  const total = subtotal

  const baseData: any = {
    number: nextReceiptNumber(tenantId),
    clientName,
    clientEmail: clientEmailRaw,
    createdByName,
    items: JSON.stringify(enriched),
    subtotal,
    total,
    status: clientEmailRaw ? 'SENT' : 'DRAFT',
    sentAt: clientEmailRaw ? new Date() : undefined,
    tenantId,
  }
  // If a case is selected, copy the lawyer assignment + snapshot the case
  // info onto the receipt row + PDF.
  if (caseSnap) {
    if (caseSnap.advocateId) baseData.advocateId = caseSnap.advocateId
  }

  let receipt
  try {
    const full: any = { ...baseData, paymentMethod }
    if (caseId && caseSnap) {
      full.caseId = caseId
      full.caseNumber = caseSnap.caseNumber
      full.caseTitle = caseSnap.title
    }
    receipt = await prisma.receipt.create({ data: full })
  } catch (e: any) {
    if (/paymentMethod|caseId|caseNumber|caseTitle/i.test(String(e?.message))) {
      // Retry without the new columns for tenants whose schema is behind.
      receipt = await prisma.receipt.create({ data: baseData })
    } else throw e
  }

  // If an email was supplied, generate the PDF and send it to the client.
  // PDF / email failures must NOT abort the receipt creation — the row is
  // already saved. We just log and continue.
  if (clientEmailRaw) {
    try { await emailReceipt(receipt) }
    catch (err) { console.error('[createReceipt] emailReceipt failed:', err) }
  }

  revalidatePath(`/team/${slug}/admin/receipts`)
  return { ok: true, receiptId: receipt.id }
 } catch (e: any) {
  console.error('[createReceipt] failed:', e)
  return { ok: false, error: e?.message || 'Could not create the receipt. Try again.' }
 }
}

export async function emailReceiptToClient(slug: string, id: string, overrideEmail?: string) {
  const { tenantId } = await authed(slug)
  const receipt = await prisma.receipt.findFirst({ where: { id, tenantId } })
  if (!receipt) throw new Error('Receipt not found')
  const to = overrideEmail?.trim() || receipt.clientEmail
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error('No valid client email on this receipt')
  await emailReceipt({ ...receipt, clientEmail: to })
  await prisma.receipt.update({
    where: { id: receipt.id },
    data: { clientEmail: to, status: 'SENT', sentAt: new Date() },
  })
  revalidatePath(`/team/${slug}/admin/receipts`)
}

export async function deleteReceipt(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.receipt.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/team/${slug}/admin/receipts`)
}
