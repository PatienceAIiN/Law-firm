'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createConsultationBooking } from '@/lib/consultation-scheduling'
import { sendEmail, generateBookingConfirmationEmail, generateBookingNotificationEmail, generateSlotFullAdminEmail } from '@/lib/email'

export async function submitContact(formData: FormData) {
  const data = {
    fullName: formData.get('fullName') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    subject: formData.get('subject') as string,
    message: formData.get('message') as string,
    serviceType: formData.get('subject') as string, // Mapping subject to serviceType
  }

  await prisma.contactSubmission.create({ data })
  revalidatePath('/admin/inbox')
}

export async function submitBooking(formData: FormData) {
  const date = formData.get('date') as string
  const slotId = formData.get('slotId') as string
  const meetingMode = formData.get('meetingMode') as 'PHYSICAL' | 'GOOGLE_MEET' | 'ZOOM'

  if (!date || !slotId || !meetingMode) {
    throw new Error('Date, slot, and meeting mode are required')
  }

  const booking = await createConsultationBooking({
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    subject: formData.get('subject') as string,
    notes: formData.get('notes') as string,
    meetingMode,
    slotId
  })

  const officeDetails = await prisma.aboutProfile.findUnique({
    where: { id: 'default-profile' }
  })
  const office = (() => {
    if (!officeDetails?.officeDetails) return {}
    try {
      return JSON.parse(officeDetails.officeDetails)
    } catch {
      return {}
    }
  })()
  const adminEmail = office?.email || process.env.BREVO_SENDER_EMAIL || booking.booking.email

  await Promise.allSettled([
    sendEmail({
      to: booking.booking.email,
      subject: `Consultation confirmed for ${booking.slot.date} ${booking.slot.startTime}`,
      htmlContent: generateBookingConfirmationEmail({
        name: booking.booking.name,
        email: booking.booking.email,
        date: booking.slot.date,
        time: `${booking.slot.startTime} - ${booking.slot.endTime}`,
        meetingMode: booking.booking.meetingMode,
        meetingLink: booking.booking.meetingMode === 'PHYSICAL' ? undefined : booking.booking.meetingLink || undefined,
        physicalAddress: booking.booking.meetingMode === 'PHYSICAL' ? booking.booking.meetingLink || booking.slot.physicalAddress || undefined : undefined,
      }),
      textContent: `Your consultation is confirmed for ${booking.slot.date} ${booking.slot.startTime}`,
    }),
    sendEmail({
      to: adminEmail,
      subject: `New consultation booked by ${booking.booking.name}`,
      htmlContent: generateBookingNotificationEmail({
        name: booking.booking.name,
        email: booking.booking.email,
        phone: booking.booking.phone,
        date: booking.slot.date,
        time: `${booking.slot.startTime} - ${booking.slot.endTime}`,
        meetingMode: booking.booking.meetingMode,
        meetingLink: booking.booking.meetingMode === 'PHYSICAL' ? undefined : booking.booking.meetingLink || undefined,
        physicalAddress: booking.booking.meetingMode === 'PHYSICAL' ? booking.booking.meetingLink || booking.slot.physicalAddress || undefined : undefined,
        subject: booking.booking.subject,
        notes: booking.booking.notes || undefined,
      }),
      textContent: `New consultation booked by ${booking.booking.name}`,
    })
  ])

  // If this booking fills the slot to capacity, send a full-slot summary email to admin
  const updatedSlot = await prisma.availabilitySlot.findUnique({
    where: { id: booking.slot.id },
    include: {
      day: true,
      bookings: {
        where: { status: 'CONFIRMED' },
        select: { name: true, email: true, phone: true, meetingMode: true, meetingLink: true, subject: true },
      },
    },
  })

  if (updatedSlot && updatedSlot.bookedCount >= updatedSlot.capacity) {
    const { formatIstTime, formatIstDate, istDateKey } = await import('@/lib/consultation-scheduling')
    await sendEmail({
      to: adminEmail,
      subject: `Slot Fully Booked — ${booking.slot.date} ${booking.slot.startTime}`,
      htmlContent: generateSlotFullAdminEmail({
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        capacity: updatedSlot.capacity,
        bookings: (updatedSlot.bookings || []).map((b: any) => ({
          name: b.name,
          email: b.email,
          phone: b.phone,
          meetingMode: b.meetingMode,
          meetingLink: b.meetingLink || null,
          subject: b.subject,
        })),
      }),
      textContent: `All ${updatedSlot.capacity} seats for the slot on ${booking.slot.date} at ${booking.slot.startTime} are now booked.`,
    }).catch(() => {})
  }

  revalidatePath('/admin/inbox')
  revalidatePath('/admin/availability')
  return booking
}
