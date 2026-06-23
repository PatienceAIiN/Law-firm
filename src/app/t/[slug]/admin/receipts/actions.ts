'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'

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
  const clientEmail = (formData.get('clientEmail') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || 'Legal services'
  const amount = parseFloat((formData.get('amount') as string) || '0')
  if (!clientName || !clientEmail || !amount) throw new Error('Client name, email, and amount are required')
  const items = JSON.stringify([{ description, qty: 1, rate: amount, amount }])
  await prisma.receipt.create({
    data: {
      number: nextReceiptNumber(tenantId),
      clientName, clientEmail,
      createdByName,
      items,
      subtotal: amount, total: amount,
      status: 'DRAFT',
      tenantId,
    },
  })
  revalidatePath(`/t/${slug}/admin/receipts`)
}

export async function deleteReceipt(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.receipt.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/t/${slug}/admin/receipts`)
}
