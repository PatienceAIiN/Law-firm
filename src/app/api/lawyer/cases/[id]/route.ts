import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'
import { logCaseActivity } from '@/lib/case-activity'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const STRING_FIELDS = ['title', 'caseType', 'court', 'judge', 'clientName', 'clientEmail', 'clientPhone', 'opposingParty', 'description']
const DATE_FIELDS = ['filingDate', 'nextHearingDate', 'courtAppearanceDate']

// Edit a case — only the assigned advocate may update their own case.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.courtCase.findUnique({ where: { id }, include: { advocate: { select: { name: true } } } })
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  if (existing.advocateId !== advocateId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const data: any = {}
  const changed: string[] = []
  const norm = (v: any) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ?? '')
  for (const f of STRING_FIELDS) {
    if (typeof body[f] === 'string') {
      data[f] = body[f] || null
      if (norm((existing as any)[f]) !== norm(body[f] || null)) changed.push(f)
    }
  }
  for (const f of DATE_FIELDS) {
    if (f in body) {
      data[f] = body[f] ? new Date(body[f]) : null
      if (norm((existing as any)[f]) !== norm(body[f] ? new Date(body[f]) : null)) changed.push(f)
    }
  }
  if (typeof body.status === 'string') data.status = body.status.toUpperCase()
  if (!data.title && body.title === '') return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const updated = await prisma.courtCase.update({ where: { id }, data })
  if (changed.length) {
    await logCaseActivity({
      caseId: id, actorType: 'ADVOCATE', actorName: existing.advocate?.name || 'Advocate',
      action: 'CASE_EDITED', details: `Updated: ${changed.join(', ')}`,
    })
  }
  revalidatePath('/admin/cases')
  return NextResponse.json({ success: true, case: { id: updated.id } })
}

// Lawyer deletes their own case (syncs to admin).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.courtCase.findUnique({ where: { id }, select: { advocateId: true } })
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  if (existing.advocateId !== advocateId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.courtCase.delete({ where: { id } })
  revalidatePath('/admin/cases')
  return NextResponse.json({ success: true })
}
