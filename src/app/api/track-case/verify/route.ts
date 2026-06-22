import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  return d ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(d) : null
}

// Step 2: verify OTP, then return non-sensitive case details + a short-lived
// access token (used by the PDF endpoint).
export async function POST(req: NextRequest) {
  let body: { requestId?: string; otp?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  if (!body.requestId || !body.otp) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const row = await prisma.caseTrackOTP.findUnique({ where: { id: body.requestId } })
  if (!row || row.used || row.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 })
  }
  if (row.otp !== body.otp.trim()) {
    return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })
  }

  const accessToken = crypto.randomBytes(24).toString('hex')
  await prisma.caseTrackOTP.update({ where: { id: row.id }, data: { used: true, accessToken } })

  const c = await prisma.courtCase.findUnique({
    where: { id: row.caseId },
    include: {
      advocate: { select: { name: true, title: true } },
      notes: { where: { isPrivate: false }, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true } },
      payments: { select: { amount: true } },
    },
  })
  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  return NextResponse.json({
    accessToken,
    case: {
      caseNumber: c.caseNumber,
      title: c.title,
      caseType: c.caseType,
      status: c.status,
      court: c.court,
      filingDate: fmtDate(c.filingDate),
      nextHearingDate: fmtDate(c.nextHearingDate),
      advocate: c.advocate ? { name: c.advocate.name, title: c.advocate.title } : null,
      notes: c.notes.map((n) => ({ content: n.content, date: fmtDate(n.createdAt) })),
      totalPaid: c.payments.reduce((s, p) => s + p.amount, 0),
    },
  })
}
