import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await getServerSession(tenantAdminAuthOptions)
  const lawyer = admin?.user ? null : await getServerSession(tenantLawyerAuthOptions)
  const u: any = admin?.user || lawyer?.user
  if (!u?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payment = await prisma.payment.findFirst({ where: { id, tenantId: u.tenantId } })
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  const isAdmin = Boolean(admin?.user)
  if (!isAdmin && payment.advocateId !== u.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (payment.status !== 'COMPLETED') return NextResponse.json({ error: 'Only completed/verified payment records can be deleted' }, { status: 400 })
  await prisma.paymentLog.deleteMany({ where: { paymentId: payment.id } }).catch(() => null)
  await prisma.payment.delete({ where: { id: payment.id } })
  return NextResponse.json({ ok: true })
}
