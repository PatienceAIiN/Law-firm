'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getBookingWithSlot } from '@/lib/meeting-workspace'
import { sendEmail, generateClientEmailPayload, type ClientEmailTemplateType } from '@/lib/email'

export async function deleteContactAction(formData: FormData) {
  const id = String(formData.get('id') || '').trim()
  if (!id) return
  await prisma.contactSubmission.delete({ where: { id } }).catch(() => {})
  revalidatePath('/admin/inbox')
}

export async function deleteBookingAction(formData: FormData) {
  const id = String(formData.get('id') || '').trim()
  if (!id) return
  const booking = await prisma.consultationBooking.findUnique({ where: { id } })
  if (!booking) return
  await prisma.$transaction(async (tx) => {
    await tx.consultationBooking.delete({ where: { id } })
    await tx.availabilitySlot.update({ where: { id: booking.slotId }, data: { bookedCount: { decrement: 1 } } }).catch(() => {})
  })
  revalidatePath('/admin/inbox')
}

export async function sendClientEmailAction(formData: FormData) {
  const bookingId = String(formData.get('bookingId') || '').trim()
  const templateType = String(formData.get('templateType') || 'booking_confirmation') as ClientEmailTemplateType

  if (!bookingId) {
    throw new Error('Booking id is required')
  }

  const booking = await getBookingWithSlot(bookingId)
  if (!booking) {
    throw new Error('Booking not found')
  }

  const isPhysical = booking.meetingMode === 'PHYSICAL'
  const meetingLink = isPhysical ? undefined : booking.meetingLink || undefined
  const physicalAddress = isPhysical ? booking.meetingLink || booking.slot?.physicalAddress || undefined : undefined
  const date = booking.slot?.day?.date ? new Date(booking.slot.day.date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Scheduled date'
  const time = booking.slot ? `${booking.slot.startTime} - ${booking.slot.endTime}` : 'Scheduled time'

  const payload = generateClientEmailPayload({
    templateType,
    name: booking.name,
    email: booking.email,
    date,
    time,
    meetingMode: booking.meetingMode,
    meetingLink,
    physicalAddress,
    subject: booking.subject,
  })

  const result = await sendEmail({
    to: booking.email,
    subject: payload.subject,
    htmlContent: payload.htmlContent,
    textContent: payload.textContent,
  })

  if (!result.success) {
    throw new Error('Failed to send client email')
  }

  revalidatePath('/admin/inbox')
}
