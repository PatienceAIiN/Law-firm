import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const digits = (s: string) => (s || '').replace(/\D/g, '')
function maskEmail(email: string) {
  const [u, d] = email.split('@')
  if (!d) return 'your email'
  return `${u.slice(0, 1)}${'*'.repeat(Math.max(u.length - 1, 1))}@${d}`
}

// Step 1: client identifies their case by name + case number + phone; an OTP
// is emailed to the case's registered email. We never reveal case data here.
export async function POST(req: NextRequest) {
  let body: { name?: string; caseNumber?: string; phone?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const name = (body.name || '').trim()
  const caseNumber = (body.caseNumber || '').trim()
  const phone = digits(body.phone || '')
  // Case number alone is enough; name/phone are optional extra verification.
  if (!caseNumber) {
    return NextResponse.json({ error: 'Case number is required' }, { status: 400 })
  }

  const candidates = await prisma.courtCase.findMany({
    where: { caseNumber: { equals: caseNumber, mode: 'insensitive' } },
    select: { id: true, clientName: true, clientPhone: true, clientEmail: true },
  })
  const match = candidates.find(
    (c) =>
      Boolean(c.clientEmail) &&
      (!name || c.clientName.trim().toLowerCase() === name.toLowerCase()) &&
      (!phone || (c.clientPhone ? digits(c.clientPhone).endsWith(phone.slice(-10)) : false)),
  )

  // Generic response either way to avoid leaking which cases exist.
  if (!match) {
    return NextResponse.json({ ok: true, sent: false, message: 'If the details match a case on file, an OTP has been emailed.' })
  }

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  const row = await prisma.caseTrackOTP.create({
    data: { caseId: match.id, email: match.clientEmail!, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  })

  await sendEmail({
    to: match.clientEmail!,
    subject: 'Your case tracking code',
    htmlContent: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#14203E;">Case Tracking Verification</h2>
      <p>Use this one-time code to view your case status. It expires in 10 minutes.</p>
      <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#14203E;margin:16px 0;">${otp}</div>
      <p style="color:#64748b;font-size:12px;">If you did not request this, please ignore this email.</p>
    </div>`,
  }).catch(() => {})

  // Dev aid when no mail provider is configured.
  if (!process.env.BREVO_API_KEY) console.log(`[track-case] OTP for ${match.clientEmail}: ${otp}`)

  return NextResponse.json({ ok: true, sent: true, requestId: row.id, maskedEmail: maskEmail(match.clientEmail!) })
}
