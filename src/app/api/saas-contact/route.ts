import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, generateContactEmailTemplate } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const fullName = (body.fullName || '').toString().trim()
  const email = (body.email || '').toString().trim()
  const subject = (body.subject || 'General inquiry').toString().trim()
  const message = (body.message || '').toString().trim()

  if (!fullName || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 })
  }

  const to =
    process.env.ADMIN_EMAIL ||
    process.env.INQUIRY_NOTIFY_EMAIL ||
    process.env.BREVO_SENDER_EMAIL
  if (!to) {
    console.warn('[saas-contact] No ADMIN_EMAIL / BREVO_SENDER_EMAIL configured; inquiry not emailed.')
    return NextResponse.json({ ok: true })
  }

  await sendEmail({
    to,
    subject: `Patience AI inquiry: ${subject}`,
    htmlContent: generateContactEmailTemplate({ fullName, email, subject, message }),
    textContent: `From: ${fullName} <${email}>\nSubject: ${subject}\n\n${message}`,
  }).catch((err) => console.error('saas-contact email failed:', err))

  return NextResponse.json({ ok: true })
}
