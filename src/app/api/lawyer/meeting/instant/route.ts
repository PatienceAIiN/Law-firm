import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Creates an instant virtual meeting room (LiveKit) hosted by the advocate and
// returns its workspace URL. Optionally emails the client a join link.
export async function POST(req: NextRequest) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const advocate = await prisma.advocate.findUnique({ where: { id: advocateId }, select: { name: true } })
  const body = await req.json().catch(() => ({}))
  const clientName = (body.clientName || 'Instant Meeting').toString()
  const clientEmail = (body.clientEmail || '').toString()
  const subject = (body.subject || 'Instant Consultation').toString()

  const now = new Date()
  const end = new Date(now.getTime() + 60 * 60 * 1000)
  const day = await prisma.availabilityDay.create({ data: { date: new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z'), isActive: true } })
  const slot = await prisma.availabilitySlot.create({
    data: { dayId: day.id, startTime: now, endTime: end, capacity: 1, bookedCount: 1, isActive: true, allowedModes: 'VIRTUAL' },
  })
  const booking = await prisma.consultationBooking.create({
    data: { slotId: slot.id, name: clientName, email: clientEmail || 'instant@local', phone: '', subject, meetingMode: 'VIRTUAL', status: 'CONFIRMED' },
  })

  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  const url = `${base}/meeting/${booking.id}`
  await prisma.consultationBooking.update({ where: { id: booking.id }, data: { meetingLink: url } })

  if (clientEmail && clientEmail.includes('@')) {
    await sendEmail({
      to: clientEmail,
      subject: `Join your meeting with ${advocate?.name || 'your advocate'}`,
      htmlContent: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#14203E;">Your meeting is ready</h2>
        <p>${advocate?.name || 'Your advocate'} has started a secure video meeting.</p>
        <a href="${url}" style="display:inline-block;background:#14203E;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:8px;">Join Meeting</a>
      </div>`,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, bookingId: booking.id, hostUrl: `${url}?admin=1`, clientUrl: url })
}
