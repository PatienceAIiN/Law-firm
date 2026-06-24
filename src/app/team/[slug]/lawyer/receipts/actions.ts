'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'
import { emailReceipt } from '@/lib/receipts'

type Result = { ok: true; receiptId: string } | { ok: false; error: string }

async function authed(slug: string) {
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  const tenant = await prisma.tenant.findUnique({ where: { id: u.tenantId as string }, select: { name: true } })
  return {
    tenantId: u.tenantId as string,
    workspaceName: tenant?.name || slug,
    advocateId: u.id as string,
    createdByName: (session!.user!.name || u.email) as string,
  }
}

function receiptPrefix(workspaceName: string) {
  return workspaceName.replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase() || 'WORKSPACE'
}

function randomCode() {
  return Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(2, 6).toUpperCase().padEnd(4, '0')
}

function nextReceiptNumber(workspaceName: string) {
  return `${receiptPrefix(workspaceName)}-${randomCode()}`
}

export async function createLawyerReceipt(slug: string, formData: FormData): Promise<Result> {
  try {
    const { tenantId, workspaceName, advocateId, createdByName } = await authed(slug)
    const clientName = ((formData.get('clientName') as string) || '').trim()
    const clientEmail = ((formData.get('clientEmail') as string) || '').trim()
    const caseId = ((formData.get('caseId') as string) || '').trim() || null
    const pmRaw = (((formData.get('paymentMethod') as string) || 'OTHER')).toUpperCase()
    const paymentMethod = ['UPI', 'NEFT', 'CASH', 'OTHER'].includes(pmRaw) ? pmRaw : 'OTHER'

    // Verify the case belongs to THIS lawyer in THIS tenant before linking.
    let caseSnap: { caseNumber: string; title: string } | null = null
    if (caseId) {
      const c = await prisma.courtCase.findFirst({
        where: { id: caseId, tenantId, advocateId },
        select: { caseNumber: true, title: true },
      })
      if (!c) return { ok: false, error: 'That case is not assigned to you.' }
      caseSnap = c
    }

    let lines: { description: string; qty: number; rate: number; amount: number }[] = []
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
              amount: 0,
            }))
            .filter((it) => it.description || it.qty > 0 || it.rate > 0)
        }
      } catch {}
    }
    if (lines.length === 0) return { ok: false, error: 'Add at least one line item.' }
    if (!clientName) return { ok: false, error: 'Client name is required' }
    if (clientEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) {
      return { ok: false, error: 'Enter a valid client email or leave it blank' }
    }

    const enriched = lines.map((l) => ({ ...l, amount: +(l.qty * l.rate).toFixed(2) }))
    const subtotal = +enriched.reduce((s, l) => s + l.amount, 0).toFixed(2)
    const total = subtotal

    const baseData: any = {
      number: nextReceiptNumber(workspaceName),
      clientName,
      clientEmail,
      createdByName,
      advocateId,
      items: JSON.stringify(enriched),
      subtotal,
      total,
      status: clientEmail ? 'SENT' : 'DRAFT',
      sentAt: clientEmail ? new Date() : undefined,
      tenantId,
    }
    if (paymentMethod) baseData.paymentMethod = paymentMethod
    if (caseId && caseSnap) {
      baseData.caseId = caseId
      baseData.caseNumber = caseSnap.caseNumber
      baseData.caseTitle = caseSnap.title
    }

    let receipt
    try {
      receipt = await prisma.receipt.create({ data: baseData })
    } catch (e: any) {
      // Pre-migration fallback — drop new columns the live schema doesn't know.
      if (/paymentMethod|caseId|caseNumber|caseTitle/i.test(String(e?.message))) {
        delete baseData.paymentMethod
        delete baseData.caseId
        delete baseData.caseNumber
        delete baseData.caseTitle
        receipt = await prisma.receipt.create({ data: baseData })
      } else throw e
    }

    if (clientEmail) {
      try { await emailReceipt(receipt) } catch (err) { console.error('emailReceipt failed:', err) }
    }

    revalidatePath(`/team/${slug}/lawyer/receipts`)
    return { ok: true, receiptId: receipt.id }
  } catch (e: any) {
    console.error('[createLawyerReceipt]', e)
    return { ok: false, error: e?.message || 'Failed to create receipt' }
  }
}

export async function deleteLawyerReceipt(slug: string, id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { tenantId, advocateId } = await authed(slug)
    const r = await prisma.receipt.findFirst({ where: { id, tenantId, advocateId } })
    if (!r) return { ok: false, error: 'Not found in your receipts.' }
    await prisma.receipt.delete({ where: { id } })
    revalidatePath(`/team/${slug}/lawyer/receipts`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not delete' }
  }
}
