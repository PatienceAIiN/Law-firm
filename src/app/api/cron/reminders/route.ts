import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCaseReminder } from '@/lib/case-reminder'

export const dynamic = 'force-dynamic'

// Fires due case reminders. Wire a scheduler (Vercel Cron / external cron) to
// hit this every few minutes. Protect with CRON_SECRET (?key=... or Bearer).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const url = new URL(req.url)
    const provided = url.searchParams.get('key') || req.headers.get('authorization')?.replace('Bearer ', '')
    if (provided !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const due = await prisma.caseReminder.findMany({
    where: { sent: false, scheduledFor: { lte: new Date() } },
    take: 50,
  })

  let sent = 0
  for (const r of due) {
    const res = await sendCaseReminder(r.caseId, { message: r.message, includeDetails: r.includeDetails })
    if (res.success) {
      await prisma.caseReminder.update({ where: { id: r.id }, data: { sent: true, sentAt: new Date() } })
      sent++
    }
  }
  return NextResponse.json({ ok: true, processed: due.length, sent })
}
