import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'
import { logCaseActivity } from '@/lib/case-activity'

export const dynamic = 'force-dynamic'

const CASE_STATUSES = ['ACTIVE', 'PENDING', 'ADJOURNED', 'DISPOSED', 'CLOSED']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { status?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const status = String(body.status || '').toUpperCase()
  if (!CASE_STATUSES.includes(status as any)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Only the assigned advocate may change their case status.
  const existing = await prisma.courtCase.findUnique({ where: { id }, select: { advocateId: true, status: true, advocate: { select: { name: true } } } })
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  if (existing.advocateId !== advocateId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updated = await prisma.courtCase.update({ where: { id }, data: { status } })
  await logCaseActivity({
    caseId: id, actorType: 'ADVOCATE', actorName: existing.advocate?.name || 'Advocate',
    action: 'STATUS_CHANGED', details: `Status changed from ${existing.status} to ${status}`,
  })
  return NextResponse.json({ success: true, status: updated.status })
}
