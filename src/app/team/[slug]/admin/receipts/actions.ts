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
  const description = (formData.get('description') as string)?.trim() || 'Legal services'
  const amount = parseFloat((formData.get('amount') as string) || '0')
  if (!clientName || !amount || isNaN(amount) || amount <= 0) {
    throw new Error('Client name and a positive amount are required')
  }
  if (clientEmailRaw && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmailRaw)) {
    throw new Error('Enter a valid client email or leave it blank')
  }

  const items = JSON.stringify([{ description, qty: 1, rate: amount, amount }])
  const receipt = await prisma.receipt.create({
    data: {
      number: nextReceiptNumber(tenantId),
      clientName,
      clientEmail: clientEmailRaw,
      createdByName,
      items,
      subtotal: amount,
      total: amount,
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
