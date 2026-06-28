import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function authedFirm() {
  const admin = await getServerSession(tenantAdminAuthOptions)
  if (admin?.user) return { role: 'admin' as const, u: admin.user as any }
  const lawyer = await getServerSession(tenantLawyerAuthOptions)
  if (lawyer?.user) return { role: 'lawyer' as const, u: lawyer.user as any }
  return null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const ctx = await authedFirm()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const t = await prisma.directThread.findUnique({ where: { id: threadId } })
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (t.tenantId !== ctx.u.tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (ctx.role === 'lawyer' && t.advocateId && t.advocateId !== ctx.u.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ note: t.firmNote || '' })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const ctx = await authedFirm()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const t = await prisma.directThread.findUnique({ where: { id: threadId } })
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (t.tenantId !== ctx.u.tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (ctx.role === 'lawyer' && t.advocateId && t.advocateId !== ctx.u.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const note = String(body?.note || '').slice(0, 5000)
  await prisma.directThread.update({ where: { id: threadId }, data: { firmNote: note } })
  return NextResponse.json({ ok: true })
}
