'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'
import { emailReceipt } from '@/lib/receipts'

const ALLOWED = ['PENDING', 'AWAITING_REVIEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'REFUNDED'] as const
type Status = (typeof ALLOWED)[number]

export async function deletePayment(
  slug: string,
  paymentId: string,
  role: 'admin' | 'lawyer' = 'admin',
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getServerSession(role === 'admin' ? tenantAdminAuthOptions : tenantLawyerAuthOptions)
    const u: any = session?.user
    if (!u?.id || u.tenantSlug !== slug) return { ok: false, error: 'Unauthorized' }

    const where: any = { id: paymentId, tenantId: u.tenantId }
    // Lawyer can only delete their own payments. Admin can delete any in
    // the workspace.
    if (role === 'lawyer') where.advocateId = u.id

    const found = await prisma.payment.findFirst({ where })
    if (!found) return { ok: false, error: 'Not in your scope' }
    await prisma.payment.delete({ where: { id: paymentId } })
    revalidatePath(`/team/${slug}/${role === 'admin' ? 'admin' : 'lawyer'}/receipts`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Delete failed' }
  }
}

export async function setPaymentStatus(
  slug: string,
  paymentId: string,
  status: string,
  role: 'admin' | 'lawyer' = 'admin',
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getServerSession(role === 'admin' ? tenantAdminAuthOptions : tenantLawyerAuthOptions)
    const u: any = session?.user
    if (!u?.id || u.tenantSlug !== slug) return { ok: false, error: 'Unauthorized' }
    const next = status.toUpperCase() as Status
    if (!ALLOWED.includes(next)) return { ok: false, error: 'Invalid status' }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: u.tenantId,
        ...(role === 'lawyer' ? { advocateId: u.id } : {}),
      },
    })
    if (!payment) return { ok: false, error: 'Payment not in your scope' }

    const approverName = (session!.user!.name || u.email || 'Unknown') as string
    const data: any = {
      status: next,
      paidAt: next === 'COMPLETED' && !payment.paidAt ? new Date() : payment.paidAt,
    }
    if (next === 'COMPLETED') {
      data.approvedById = u.id
      data.approvedByName = approverName
      data.approvedByRole = role
    }
    let updated
    try { updated = await prisma.payment.update({ where: { id: paymentId }, data }) }
    catch (e: any) {
      if (/approvedBy/i.test(String(e?.message))) {
        delete data.approvedById; delete data.approvedByName; delete data.approvedByRole
        updated = await prisma.payment.update({ where: { id: paymentId }, data })
      } else throw e
    }

    // On COMPLETED, mark receipt PAID and re-send the receipt as a paid copy.
    if (next === 'COMPLETED' && payment.receiptId) {
      const receipt = await prisma.receipt.update({
        where: { id: payment.receiptId },
        data: { status: 'PAID', sentAt: new Date() },
      })
      emailReceipt(receipt).catch((e) => console.warn('[setPaymentStatus] success email skipped:', e?.message))
    }

    revalidatePath(`/team/${slug}/${role === 'admin' ? 'admin' : 'lawyer'}/receipts`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Update failed' }
  }
}
