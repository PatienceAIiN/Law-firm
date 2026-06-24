import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'

const ALLOWED = new Set(['PENDING', 'RECEIVED', 'RECONCILIATION', 'COMPLETED', 'FAILED'])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await getServerSession(tenantAdminAuthOptions)
  const lawyer = admin?.user ? null : await getServerSession(tenantLawyerAuthOptions)
  const u: any = admin?.user || lawyer?.user
  if (!u?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const status = String(body.status || '').toUpperCase()
  if (!ALLOWED.has(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  const payment = await prisma.payment.findFirst({ where: { id, tenantId: u.tenantId } })
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  const isAdmin = !!admin?.user
  if (!isAdmin && payment.advocateId !== u.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status,
      paidAt: status === 'COMPLETED' || status === 'RECEIVED' ? (payment.paidAt || new Date()) : payment.paidAt,
      verificationRequired: status === 'RECEIVED' ? payment.verificationRequired : false,
      statusUpdatedByType: isAdmin ? 'ADMIN' : 'ADVOCATE',
      statusUpdatedById: u.id,
      statusUpdatedByName: u.name || u.email || (isAdmin ? 'Admin' : 'Advocate'),
      statusUpdatedAt: new Date(),
    } as any,
  })
  await prisma.paymentLog.create({ data: { paymentId: id, tenantId: u.tenantId, actorType: isAdmin ? 'ADMIN' : 'ADVOCATE', actorId: u.id, actorName: u.name || u.email || 'User', action: 'STATUS_CHANGED', fromStatus: payment.status, toStatus: status, details: body.note ? String(body.note) : null } as any }).catch(() => null)
  return NextResponse.json({ ok: true, payment: updated })
}
