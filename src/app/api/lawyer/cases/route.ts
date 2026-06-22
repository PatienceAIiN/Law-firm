import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'
import { logCaseActivity } from '@/lib/case-activity'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

// Lawyer creates a case assigned to themselves. It syncs to the central admin
// panel automatically (same CourtCase table).
export async function POST(req: NextRequest) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const required = ['caseNumber', 'title', 'caseType', 'court', 'clientName', 'clientEmail']
  for (const f of required) {
    if (!body[f]?.trim?.()) return NextResponse.json({ error: `${f} is required` }, { status: 400 })
  }

  const advocate = await prisma.advocate.findUnique({ where: { id: advocateId }, select: { name: true } })

  const caseNumber = body.caseNumber.trim()
  // Case numbers must be unique so a single number resolves one case.
  const dupe = await prisma.courtCase.findFirst({ where: { caseNumber: { equals: caseNumber, mode: 'insensitive' } }, select: { id: true } })
  if (dupe) return NextResponse.json({ error: 'A case with this case number already exists' }, { status: 409 })

  const created = await prisma.courtCase.create({
    data: {
      caseNumber,
      title: body.title.trim(),
      caseType: body.caseType.trim(),
      status: (body.status || 'ACTIVE').toUpperCase(),
      court: body.court.trim(),
      judge: body.judge || null,
      clientName: body.clientName.trim(),
      clientEmail: body.clientEmail.trim(),
      clientPhone: body.clientPhone || null,
      opposingParty: body.opposingParty || null,
      filingDate: body.filingDate ? new Date(body.filingDate) : null,
      nextHearingDate: body.nextHearingDate ? new Date(body.nextHearingDate) : null,
      description: body.description || null,
      advocateId,
    },
  })

  await logCaseActivity({ caseId: created.id, actorType: 'ADVOCATE', actorName: advocate?.name || 'Advocate', action: 'CASE_CREATED', details: `Created case ${created.caseNumber}` })
  revalidatePath('/admin/cases')

  return NextResponse.json({ success: true, id: created.id, caseNumber: created.caseNumber })
}
