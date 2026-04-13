import 'server-only'

import { prisma } from './prisma'
import {
  formatIstTime,
  formatIstTimeValue,
  generateMeetingLink,
  istDateKey,
  parseAllowedModes,
  type MeetingMode,
} from './consultation-scheduling'
import { createGoogleMeetEvent, createZoomMeeting } from './meeting-providers'

export async function createConsultationBooking(input: {
  name: string
  email: string
  phone: string
  subject: string
  notes?: string
  meetingMode: MeetingMode
  slotId: string
}) {
  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: input.slotId },
    include: { day: true },
  })

  if (!slot || !slot.isActive) {
    throw new Error('Selected slot is unavailable')
  }

  const allowedModes = parseAllowedModes(slot.allowedModes)
  if (!allowedModes.includes(input.meetingMode)) {
    throw new Error('Selected meeting mode is not available for this slot')
  }

  if (slot.bookedCount >= slot.capacity) {
    throw new Error('Selected slot is fully booked')
  }

  let resolvedMeetingLink = ''
  if (input.meetingMode === 'PHYSICAL') {
    resolvedMeetingLink = slot.physicalAddress || ''
  } else if (slot.manualMeetingLink) {
    resolvedMeetingLink = slot.manualMeetingLink
  } else {
    const dateKey = istDateKey(slot.day.date)
    const startISO = `${dateKey}T${formatIstTimeValue(slot.startTime)}:00+05:30`
    const endISO = `${dateKey}T${formatIstTimeValue(slot.endTime)}:00+05:30`
    const durationMs = slot.endTime.getTime() - slot.startTime.getTime()
    const durationMinutes = Math.round(durationMs / 60_000) || 60

    if (input.meetingMode === 'GOOGLE_MEET') {
      const link = await createGoogleMeetEvent({
        summary: `Legal Consultation — ${input.name}`,
        description: input.subject,
        startISO,
        endISO,
        attendeeEmails: [input.email],
      }).catch(() => null)
      resolvedMeetingLink = link || generateMeetingLink(input.meetingMode, 'pending', slot.id)
    } else if (input.meetingMode === 'ZOOM') {
      const link = await createZoomMeeting({
        topic: `Legal Consultation — ${input.name}`,
        startISO,
        durationMinutes,
        agenda: input.subject,
      }).catch(() => null)
      resolvedMeetingLink = link || generateMeetingLink(input.meetingMode, 'pending', slot.id)
    }
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.consultationBooking.create({
      data: {
        slotId: slot.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        subject: input.subject,
        notes: input.notes || null,
        meetingMode: input.meetingMode,
        meetingLink: resolvedMeetingLink,
        status: 'CONFIRMED',
      },
    })

    await tx.availabilitySlot.update({
      where: { id: slot.id },
      data: {
        bookedCount: { increment: 1 },
      },
    })

    return tx.consultationBooking.findUnique({
      where: { id: created.id },
      include: {
        slot: {
          include: {
            day: true,
          },
        },
      },
    })
  })

  if (!booking) throw new Error('Failed to create booking record')

  return {
    booking,
    slot: {
      id: slot.id,
      date: istDateKey(slot.day.date),
      startTime: formatIstTime(slot.startTime),
      endTime: formatIstTime(slot.endTime),
      capacity: slot.capacity,
      bookedCount: slot.bookedCount + 1,
      availableCount: Math.max(slot.capacity - slot.bookedCount - 1, 0),
      allowedModes: parseAllowedModes(slot.allowedModes),
      manualMeetingLink: slot.manualMeetingLink,
      physicalAddress: slot.physicalAddress,
    },
  }
}
