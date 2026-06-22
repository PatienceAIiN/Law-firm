import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getBookingWithSlot } from '@/lib/meeting-workspace'

export const dynamic = 'force-dynamic'

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(d)
}
function formatTime(d: Date) {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(d)
}

function buildHtml(opts: {
  subject: string
  clientName: string
  date: string
  time: string
  notes: string
  attendees: string[]
}) {
  const notesHtml = opts.notes
    .split('\n')
    .map((line) => (line.trim() ? `<li style="margin:4px 0;">${escapeHtml(line)}</li>` : ''))
    .join('')
  return `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
    <div style="background:#14203E;color:#fff;padding:24px;border-radius:16px 16px 0 0;">
      <div style="color:#14203E;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:800;">Minutes of Meeting</div>
      <h1 style="margin:8px 0 0;font-size:22px;">${escapeHtml(opts.subject)}</h1>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 16px 16px;">
      <p style="margin:0 0 8px;"><strong>Client:</strong> ${escapeHtml(opts.clientName)}</p>
      <p style="margin:0 0 8px;"><strong>Date:</strong> ${opts.date}</p>
      <p style="margin:0 0 8px;"><strong>Time:</strong> ${opts.time}</p>
      <p style="margin:0 0 16px;"><strong>Attendees:</strong> ${opts.attendees.map(escapeHtml).join(', ')}</p>
      <h2 style="font-size:15px;border-bottom:2px solid #14203E;padding-bottom:6px;">Discussion Notes</h2>
      ${notesHtml ? `<ul style="padding-left:18px;font-size:14px;line-height:1.6;">${notesHtml}</ul>` : '<p style="color:#64748b;font-size:14px;">No notes were recorded.</p>'}
      <p style="margin-top:24px;color:#94a3b8;font-size:12px;">This is an automated summary sent to all meeting participants.</p>
    </div>
  </div>`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

// Sends one email, trying Brevo, then SMTP, then console-log fallback (dev).
async function deliver(to: string, subject: string, html: string) {
  const brevo = await sendEmail({ to, subject, htmlContent: html })
  if (brevo.success) return 'brevo'

  if (process.env.SMTP_HOST) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
      await transport.sendMail({
        from: `${process.env.BREVO_SENDER_NAME || 'Law Firm'} <${process.env.BREVO_SENDER_EMAIL || 'noreply@lawfirm.local'}>`,
        to,
        subject,
        html,
      })
      return 'smtp'
    } catch (err) {
      console.error('SMTP send failed:', err)
    }
  }

  // Dev fallback: log so the flow can be verified without a mail provider.
  console.log(`[MoM] (no mail provider configured) would email "${subject}" to ${to}`)
  return 'logged'
}

export async function POST(req: NextRequest) {
  let body: { bookingId?: string; notes?: string; recipients?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { bookingId, notes = '', recipients = [] } = body
  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
  }

  const booking = await getBookingWithSlot(bookingId)
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const admin = await prisma.adminUser.findFirst({ select: { email: true } }).catch(() => null)

  // Build the unique recipient list: client + admin + any extras.
  const toList = Array.from(
    new Set(
      [booking.email, admin?.email, ...recipients]
        .filter((e): e is string => Boolean(e && e.includes('@'))),
    ),
  )

  if (toList.length === 0) {
    return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 })
  }

  const html = buildHtml({
    subject: booking.subject || 'Consultation Meeting',
    clientName: booking.name,
    date: formatDate(booking.slot.day.date),
    time: `${formatTime(booking.slot.startTime)} – ${formatTime(booking.slot.endTime)}`,
    notes,
    attendees: toList,
  })

  const subject = `Minutes of Meeting — ${booking.subject || 'Consultation'} (${formatDate(booking.slot.day.date)})`

  const results = await Promise.all(toList.map((to) => deliver(to, subject, html)))
  const method = results[0] || 'logged'

  return NextResponse.json({
    success: true,
    recipients: toList,
    delivery: method,
    note: method === 'logged' ? 'No mail provider configured — email content logged to server console.' : undefined,
  })
}
