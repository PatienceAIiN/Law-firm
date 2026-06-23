'use server'

import { prisma } from '@/lib/prisma'
import { createConsultationBooking, istDateKey, formatIstTime, type MeetingMode } from '@/lib/consultation-scheduling'
import { revalidatePath } from 'next/cache'

export async function submitContact(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const phone = (formData.get('phone') as string) || null
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  if (!fullName || !email || !subject || !message) {
    throw new Error('Missing required fields')
  }

  await prisma.contactSubmission.create({
    data: { fullName, email, phone, subject, message },
  })

  revalidatePath('/contact')
}

export async function submitBooking(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const subject = formData.get('subject') as string
  const notes = (formData.get('notes') as string) || undefined
  const slotId = formData.get('slotId') as string
  const meetingMode = (formData.get('meetingMode') as MeetingMode) || 'VIRTUAL'

  if (!name || !email || !phone || !subject || !slotId) {
    throw new Error('Missing required fields')
  }

  const result = await createConsultationBooking({
    name,
    email,
    phone,
    subject,
    notes,
    meetingMode,
    slotId,
  })

  revalidatePath('/consultation')

  return {
    booking: {
      id: result.booking.id,
      name: result.booking.name,
      email: result.booking.email,
      phone: result.booking.phone,
      subject: result.booking.subject,
      notes: result.booking.notes,
      meetingMode: result.booking.meetingMode as MeetingMode,
      meetingLink: result.booking.meetingLink,
    },
    slot: {
      date: result.slot.date,
      startTime: result.slot.startTime,
      endTime: result.slot.endTime,
      physicalAddress: result.slot.physicalAddress,
    },
  }
}
