'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateBookingConfirmationEmail } from '@/lib/email'

export async function createAdvocateCase(slug: string, formData: FormData) {
  const session = await getServerSession(tenantLawyerAuthOptions)
  const user: any = session?.user
  
  if (!user?.id || user.tenantSlug !== slug) {
    throw new Error('Unauthorized')
  }

  const caseNumber = (formData.get('caseNumber') as string)?.trim()
  const title = (formData.get('title') as string)?.trim()
  const caseType = (formData.get('caseType') as string)?.trim() || 'Civil'
  const court = (formData.get('court') as string)?.trim()
  const clientName = (formData.get('clientName') as string)?.trim()
  const clientEmail = (formData.get('clientEmail') as string)?.trim() || ''
  const clientPhone = (formData.get('clientPhone') as string)?.trim() || ''

  if (!caseNumber || !title || !court || !clientName) {
    throw new Error('Case number, title, court, and client name are required')
  }

  await prisma.courtCase.create({
    data: {
      caseNumber,
      title,
      caseType,
      status: 'ACTIVE',
      court,
      clientName,
      clientEmail,
      clientPhone: clientPhone || undefined,
      advocateId: user.id,
      tenantId: user.tenantId,
    },
  })

  revalidatePath(`/team/${slug}/lawyer`)
  revalidatePath(`/team/${slug}/admin/cases`)
}

export async function deleteBooking(slug: string, bookingId: string) {
  const session = await getServerSession(tenantLawyerAuthOptions)
  const user: any = session?.user
  if (!user?.id || user.tenantSlug !== slug) throw new Error('Unauthorized')

  await prisma.consultationBooking.delete({
    where: { id: bookingId, tenantId: user.tenantId }
  })
  
  revalidatePath(`/team/${slug}/lawyer`)
}

export async function resendBookingEmail(slug: string, bookingId: string) {
  const session = await getServerSession(tenantLawyerAuthOptions)
  const user: any = session?.user
  if (!user?.id || user.tenantSlug !== slug) throw new Error('Unauthorized')

  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId, tenantId: user.tenantId },
    include: { slot: { include: { day: true } } }
  })
  if (!booking) throw new Error('Booking not found')

  const date = booking.slot.day.date.toLocaleDateString()
  const time = booking.slot.startTime.toLocaleTimeString()

  const html = generateBookingConfirmationEmail({
    name: booking.name,
    email: booking.email,
    date,
    time,
    meetingMode: booking.meetingMode,
    meetingLink: booking.meetingLink || undefined,
  })

  await sendEmail({
    to: booking.email,
    subject: `Consultation Confirmed: ${date} ${time}`,
    htmlContent: html,
  })
}
