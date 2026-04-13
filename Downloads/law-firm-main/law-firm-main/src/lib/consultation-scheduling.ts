import { prisma } from './prisma'
import { createGoogleMeetEvent, createZoomMeeting } from './meeting-providers'

export const IST_TIME_ZONE = 'Asia/Kolkata'

export type MeetingMode = 'PHYSICAL' | 'GOOGLE_MEET' | 'ZOOM'

export type AvailabilitySlotView = {
  id: string
  startTime: string
  endTime: string
  startTimeValue: string
  endTimeValue: string
  capacity: number
  bookedCount: number
  availableCount: number
  isActive: boolean
  allowedModes: MeetingMode[]
  manualMeetingLink: string | null
  physicalAddress: string | null
}

export type AvailabilityDayView = {
  date: string
  slots: AvailabilitySlotView[]
  totalSlots: number
  availableSlots: number
  bookedSlots: number
}

function filterSlotsByMode(slots: any[], meetingMode?: MeetingMode) {
  return slots
    .filter((slot) => slot.isActive)
    .filter((slot) => {
      if (!meetingMode) return true
      return parseAllowedModes(slot.allowedModes).includes(meetingMode)
    })
}

function formatParts(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: IST_TIME_ZONE, ...options }).format(date)
}

function addMonthsSafe(date: Date, amount: number) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + amount)
  return result
}

export function istDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)

  const year = parts.find((p) => p.type === 'year')?.value || '1970'
  const month = parts.find((p) => p.type === 'month')?.value || '01'
  const day = parts.find((p) => p.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

export function parseIstDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+05:30`)
}

export function parseIstDateTime(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00+05:30`)
}

export function formatIstDate(date: Date) {
  return formatParts(date, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatIstTime(date: Date) {
  return formatParts(date, { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatIstTimeValue(date: Date) {
  return formatParts(date, { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function parseAllowedModes(raw: string | null | undefined): MeetingMode[] {
  if (!raw) return ['PHYSICAL', 'GOOGLE_MEET', 'ZOOM']
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as MeetingMode[]
}

function serializeSlot(slot: any): AvailabilitySlotView {
  return {
    id: slot.id,
    startTime: formatIstTime(slot.startTime),
    endTime: formatIstTime(slot.endTime),
    startTimeValue: formatIstTimeValue(slot.startTime),
    endTimeValue: formatIstTimeValue(slot.endTime),
    capacity: slot.capacity,
    bookedCount: slot.bookedCount,
    availableCount: Math.max(slot.capacity - slot.bookedCount, 0),
    isActive: slot.isActive,
    allowedModes: parseAllowedModes(slot.allowedModes),
    manualMeetingLink: slot.manualMeetingLink,
    physicalAddress: slot.physicalAddress,
  }
}

export async function getAvailabilityForDate(dateKey: string, meetingMode?: MeetingMode): Promise<AvailabilityDayView> {
  const date = parseIstDate(dateKey)
  const day = await prisma.availabilityDay.findFirst({
    where: { date },
    include: {
      slots: {
        orderBy: { startTime: 'asc' }
      }
    }
  })

  const slots = filterSlotsByMode(day?.slots || [], meetingMode).map(serializeSlot)

  return {
    date: dateKey,
    slots,
    totalSlots: slots.length,
    availableSlots: slots.reduce((sum, slot) => sum + (slot.availableCount || 0), 0),
    bookedSlots: slots.reduce((sum, slot) => sum + (slot.bookedCount || 0), 0),
  }
}

export async function listAvailabilityForMonth(monthKey: string, meetingMode?: MeetingMode) {
  const monthStart = parseIstDate(`${monthKey}-01`)
  const monthEnd = addMonthsSafe(monthStart, 1)

  const days = await prisma.availabilityDay.findMany({
    where: {
      date: {
        gte: monthStart,
        lt: monthEnd,
      }
    },
    include: {
      slots: {
        orderBy: { startTime: 'asc' }
      }
    },
    orderBy: { date: 'asc' }
  })

  return days.map((day) => {
    const slots = filterSlotsByMode(day.slots || [], meetingMode)

    return {
      date: istDateKey(day.date),
      slots: slots.map(serializeSlot),
      totalSlots: slots.length,
      availableSlots: slots.reduce((sum, slot) => sum + Math.max((slot.capacity || 0) - (slot.bookedCount || 0), 0), 0),
      bookedSlots: slots.reduce((sum, slot) => sum + (slot.bookedCount || 0), 0),
    }
  })
}

async function findOrCreateDay(dateKey: string) {
  const date = parseIstDate(dateKey)
  const existing = await prisma.availabilityDay.findFirst({ where: { date } })
  if (existing) return existing

  return prisma.availabilityDay.create({
    data: {
      date,
      isActive: true,
    }
  })
}

export async function createAvailabilitySlot(input: {
  date: string
  startTime: string
  endTime: string
  capacity: number
  allowedModes: MeetingMode[]
  manualMeetingLink?: string | null
  physicalAddress?: string | null
}) {
  const day = await findOrCreateDay(input.date)
  const slot = await prisma.availabilitySlot.create({
    data: {
      dayId: day.id,
      startTime: parseIstDateTime(input.date, input.startTime),
      endTime: parseIstDateTime(input.date, input.endTime),
      capacity: input.capacity,
      allowedModes: input.allowedModes.join(','),
      manualMeetingLink: input.manualMeetingLink || null,
      physicalAddress: input.physicalAddress || null,
      isActive: true,
    }
  })

  return serializeSlot(slot)
}

export async function updateAvailabilitySlot(
  slotId: string,
  input: Partial<{
    date: string
    startTime: string
    endTime: string
    capacity: number
    allowedModes: MeetingMode[]
    manualMeetingLink: string | null
    physicalAddress: string | null
    isActive: boolean
  }>
) {
  const current = await prisma.availabilitySlot.findUnique({
    where: { id: slotId },
    include: { day: true }
  })

  if (!current) {
    throw new Error('Slot not found')
  }

  let dayId = current.dayId
  const dateKey = input.date || istDateKey(current.day.date)
  const currentStart = formatIstTimeValue(current.startTime)
  const currentEnd = formatIstTimeValue(current.endTime)
  if (input.date) {
    const day = await findOrCreateDay(input.date)
    dayId = day.id
  }

  const updated = await prisma.availabilitySlot.update({
    where: { id: slotId },
    data: {
      dayId,
      ...(input.startTime || input.date ? { startTime: parseIstDateTime(dateKey, input.startTime || currentStart) } : {}),
      ...(input.endTime || input.date ? { endTime: parseIstDateTime(dateKey, input.endTime || currentEnd) } : {}),
      ...(typeof input.capacity === 'number' ? { capacity: input.capacity } : {}),
      ...(input.allowedModes ? { allowedModes: input.allowedModes.join(',') } : {}),
      ...(input.manualMeetingLink !== undefined ? { manualMeetingLink: input.manualMeetingLink } : {}),
      ...(input.physicalAddress !== undefined ? { physicalAddress: input.physicalAddress } : {}),
      ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
    }
  })

  return serializeSlot(updated)
}

export async function deleteAvailabilitySlot(slotId: string) {
  await prisma.availabilitySlot.delete({ where: { id: slotId } })
}

export function generateMeetingLink(mode: MeetingMode, bookingId: string, slotId: string) {
  const code = `${bookingId.slice(0, 8)}-${slotId.slice(0, 8)}`
  if (mode === 'GOOGLE_MEET') {
    return `https://meet.google.com/${code}`
  }
  if (mode === 'ZOOM') {
    return `https://zoom.us/j/${code}`
  }
  return ''
}

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
    include: { day: true }
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

  // Resolve meeting link — try real OAuth APIs first, fallback to generated link
  let resolvedMeetingLink = ''
  if (input.meetingMode === 'PHYSICAL') {
    resolvedMeetingLink = slot.physicalAddress || ''
  } else if (slot.manualMeetingLink) {
    resolvedMeetingLink = slot.manualMeetingLink
  } else {
    // Build time strings for API calls (ISO 8601 in IST)
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
      }
    })

    await tx.availabilitySlot.update({
      where: { id: slot.id },
      data: {
        bookedCount: { increment: 1 }
      }
    })

    return tx.consultationBooking.findUnique({
      where: { id: created.id },
      include: {
        slot: {
          include: {
            day: true
          }
        }
      }
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
    }
  }
}
