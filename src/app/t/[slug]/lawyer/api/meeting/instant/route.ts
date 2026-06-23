import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Tenant-scoped instant meeting. Creates an ephemeral availability day + slot
// + confirmed booking under the lawyer's tenant, then returns a host URL.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const advocate = await prisma.advocate.findFirst({
    where: { id: u.id, tenantId: u.tenantId },
    select: { id: true, name: true },
  })
  if (!advocate) return NextResponse.json({ error: 'Advocate not in this workspace' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const clientName = (body.clientName || 'Instant Meeting').toString()
  const clientEmail = (body.clientEmail || '').toString()
  const subject = (body.subject || 'Instant Consultation').toString()

  const now = new Date()
  const end = new Date(now.getTime() + 60 * 60 * 1000)
  const day = await prisma.availabilityDay.create({
    data: { date: new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z'), isActive: true, tenantId: u.tenantId },
  })
  const slot = await prisma.availabilitySlot.create({
    data: { dayId: day.id, startTime: now, endTime: end, capacity: 1, bookedCount: 1, isActive: true, allowedModes: 'VIRTUAL' },
  })
  const booking = await prisma.consultationBooking.create({
    data: {
      slotId: slot.id,
      name: clientName,
      email: clientEmail || 'instant@local',
      phone: '',
      subject,
      meetingMode: 'VIRTUAL',
      status: 'CONFIRMED',
      tenantId: u.tenantId,
    },
  })

  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
  const url = `${base}/meeting/${booking.id}`
  await prisma.consultationBooking.update({ where: { id: booking.id }, data: { meetingLink: url } })

  if (clientEmail.includes('@')) {
    await sendEmail({
      to: clientEmail,
      subject: `Join your meeting with ${advocate.name}`,
      htmlContent: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#14203E;">Your meeting is ready</h2>
        <p>${advocate.name} has started a secure video meeting.</p>
        <a href="${url}" style="display:inline-block;background:#14203E;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:8px;">Join meeting</a>
      </div>`,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, bookingId: booking.id, hostUrl: `${url}?admin=1`, clientUrl: url })
}
