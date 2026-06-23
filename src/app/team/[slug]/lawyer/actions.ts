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

export async function updateAdvocateCase(
  slug: string,
  caseId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getServerSession(tenantLawyerAuthOptions)
    const user: any = session?.user
    if (!user?.id || user.tenantSlug !== slug) return { ok: false, error: 'Unauthorized' }

    const existing = await prisma.courtCase.findFirst({
      where: { id: caseId, tenantId: user.tenantId, advocateId: user.id },
    })
    if (!existing) return { ok: false, error: 'Case not found or not assigned to you.' }

    const caseNumber = (formData.get('caseNumber') as string)?.trim() || existing.caseNumber
    const title = (formData.get('title') as string)?.trim() || existing.title
    const caseType = (formData.get('caseType') as string)?.trim() || existing.caseType
    const status = (formData.get('status') as string)?.trim() || existing.status
    const court = (formData.get('court') as string)?.trim() || existing.court
    const clientName = (formData.get('clientName') as string)?.trim() || existing.clientName
    const clientEmail = (formData.get('clientEmail') as string)?.trim() ?? existing.clientEmail
    const clientPhone = (formData.get('clientPhone') as string)?.trim() ?? existing.clientPhone

    await prisma.courtCase.update({
      where: { id: existing.id },
      data: {
        caseNumber, title, caseType, status, court,
        clientName, clientEmail: clientEmail || '', clientPhone: clientPhone || null,
      },
    })
    revalidatePath(`/team/${slug}/lawyer`)
    revalidatePath(`/team/${slug}/admin/cases`)
    return { ok: true }
  } catch (e: any) {
    console.error('[updateAdvocateCase]', e)
    return { ok: false, error: e?.message || 'Could not update the case.' }
  }
}

export async function deleteAdvocateCase(
  slug: string,
  caseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getServerSession(tenantLawyerAuthOptions)
    const user: any = session?.user
    if (!user?.id || user.tenantSlug !== slug) return { ok: false, error: 'Unauthorized' }

    const existing = await prisma.courtCase.findFirst({
      where: { id: caseId, tenantId: user.tenantId, advocateId: user.id },
    })
    if (!existing) return { ok: false, error: 'Case not found or not assigned to you.' }

    await prisma.courtCase.delete({ where: { id: existing.id } })
    revalidatePath(`/team/${slug}/lawyer`)
    revalidatePath(`/team/${slug}/admin/cases`)
    return { ok: true }
  } catch (e: any) {
    console.error('[deleteAdvocateCase]', e)
    return { ok: false, error: e?.message || 'Could not delete the case.' }
  }
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
