import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantBySlug } from '@/lib/tenant'
import { sendEmail, generateBookingConfirmationEmail, generateBookingNotificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const slotId = (body.slotId || '').toString()
  const name = (body.name || '').toString().trim()
  const email = (body.email || '').toString().trim()
  const phone = (body.phone || '').toString().trim()
  const subject = (body.subject || 'Consultation').toString().trim()
  const meetingMode = ['PHYSICAL', 'VIRTUAL', 'GOOGLE_MEET', 'ZOOM'].includes((body.meetingMode || '').toString())
    ? body.meetingMode
    : 'VIRTUAL'
  if (!slotId || !name || !email) {
    return NextResponse.json({ error: 'Slot, name, and email are required' }, { status: 400 })
  }

  // Verify slot belongs to this tenant via its day.
  const slot = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, day: { tenantId: tenant.id }, isActive: true },
    include: { day: true },
  })
  if (!slot) return NextResponse.json({ error: 'Slot not available' }, { status: 404 })
  if (slot.bookedCount >= slot.capacity) {
    return NextResponse.json({ error: 'Slot is full' }, { status: 409 })
  }

  // Atomic-ish: bump booked count then create booking. Race-safe enough for the
  // single-row capacity check we have here.
  const booking = await prisma.$transaction(async (tx) => {
    const fresh = await tx.availabilitySlot.findUnique({ where: { id: slot.id } })
    if (!fresh || fresh.bookedCount >= fresh.capacity) throw new Error('Slot just filled up')
    await tx.availabilitySlot.update({ where: { id: slot.id }, data: { bookedCount: { increment: 1 } } })
    return tx.consultationBooking.create({
      data: {
        slotId: slot.id,
        name, email, phone: phone || '', subject,
        meetingMode,
        status: 'CONFIRMED',
        tenantId: tenant.id,
      },
    })
  }).catch((e) => ({ __err: e?.message || 'Booking failed' } as any))
  if ((booking as any).__err) return NextResponse.json({ error: (booking as any).__err }, { status: 409 })

  const slotDateLabel = slot.day.date.toISOString().slice(0, 10)
  const slotTimeLabel = `${slot.startTime.toISOString().slice(11, 16)} - ${slot.endTime.toISOString().slice(11, 16)}`

  // Confirm to the client and notify the tenant owner. Errors are swallowed —
  // booking still succeeds even if email delivery fails.
  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: `Consultation confirmed — ${slotDateLabel} ${slotTimeLabel}`,
      htmlContent: generateBookingConfirmationEmail({
        name, email, date: slotDateLabel, time: slotTimeLabel, meetingMode,
      }),
      textContent: `Your consultation is confirmed for ${slotDateLabel} at ${slotTimeLabel}.`,
    }),
    sendEmail({
      to: tenant.ownerEmail,
      subject: `New booking by ${name} — ${slotDateLabel} ${slotTimeLabel}`,
      htmlContent: generateBookingNotificationEmail({
        name, email, phone, date: slotDateLabel, time: slotTimeLabel, meetingMode, subject,
      }),
      textContent: `${name} booked ${slotDateLabel} at ${slotTimeLabel}.`,
    }),
  ])

  return NextResponse.json({ ok: true, bookingId: (booking as any).id })
}
