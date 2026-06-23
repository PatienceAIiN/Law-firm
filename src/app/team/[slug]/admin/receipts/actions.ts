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

export async function createReceipt(slug: string, formData: FormData) {
  const { tenantId, name: createdByName } = await authed(slug)
  const clientName = (formData.get('clientName') as string)?.trim()
  const clientEmailRaw = (formData.get('clientEmail') as string)?.trim() || ''

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
    if (!amount || isNaN(amount) || amount <= 0) throw new Error('Add at least one line item with a positive amount.')
    lines = [{ description, qty: 1, rate: amount }]
  }
  if (!clientName) throw new Error('Client name is required')
  if (clientEmailRaw && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmailRaw)) {
    throw new Error('Enter a valid client email or leave it blank')
  }

  const enriched = lines.map((l) => ({ ...l, amount: +(l.qty * l.rate).toFixed(2) }))
  const subtotal = +enriched.reduce((s, l) => s + l.amount, 0).toFixed(2)
  const total = subtotal

  const receipt = await prisma.receipt.create({
    data: {
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
    },
  })

  // If an email was supplied, generate the PDF and send it to the client.
  if (clientEmailRaw) {
    try { await emailReceipt(receipt) }
    catch (err) { console.error('emailReceipt failed:', err) }
  }

  revalidatePath(`/team/${slug}/admin/receipts`)
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
