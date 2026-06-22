import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'
import { logCaseActivity } from '@/lib/case-activity'
import { sendCaseReminder } from '@/lib/case-reminder'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.courtCase.findUnique({ where: { id }, select: { advocateId: true, advocate: { select: { name: true } } } })
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  if (existing.advocateId !== advocateId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const { nextHearingDate, message, includeDetails = true, scheduledFor, sendNow } = body
  const actor = existing.advocate?.name || 'Advocate'

  // Optionally update the next hearing date.
  if (nextHearingDate) {
    await prisma.courtCase.update({ where: { id }, data: { nextHearingDate: new Date(nextHearingDate) } })
    await logCaseActivity({ caseId: id, actorType: 'ADVOCATE', actorName: actor, action: 'HEARING_UPDATED', details: `Next hearing set to ${nextHearingDate}` })
  }

  if (sendNow) {
    const r = await sendCaseReminder(id, { message, includeDetails })
    if (!r.success) return NextResponse.json({ error: r.error || 'Failed to send' }, { status: 500 })
    await logCaseActivity({ caseId: id, actorType: 'ADVOCATE', actorName: actor, action: 'REMINDER_SENT', details: 'Reminder emailed now' })
    return NextResponse.json({ success: true, mode: 'sent', delivered: r.delivered, recipients: r.recipients })
  }

  if (!scheduledFor) return NextResponse.json({ error: 'Pick a date/time or choose Send Now' }, { status: 400 })
  const when = new Date(scheduledFor)
  if (isNaN(when.getTime())) return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })

  await prisma.caseReminder.create({ data: { caseId: id, scheduledFor: when, message: message || null, includeDetails: Boolean(includeDetails), createdBy: actor } })
  await logCaseActivity({ caseId: id, actorType: 'ADVOCATE', actorName: actor, action: 'REMINDER_SCHEDULED', details: `Reminder scheduled for ${when.toLocaleString('en-IN')}` })
  return NextResponse.json({ success: true, mode: 'scheduled', scheduledFor: when.toISOString() })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const reminders = await prisma.caseReminder.findMany({ where: { caseId: id }, orderBy: { scheduledFor: 'desc' }, take: 20 })
  return NextResponse.json({ reminders })
}
