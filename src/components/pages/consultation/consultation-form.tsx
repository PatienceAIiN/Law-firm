'use client'

import { useEffect, useMemo, useState } from 'react'
import { submitBooking } from '@/app/(marketing)/contact/actions'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Link as LinkIcon,
  MapPin,
  Video,
  X,
} from 'lucide-react'
import { formatIstDate, generateMeetingLink, istDateKey, parseIstDate, type MeetingMode } from '@/lib/consultation-scheduling'

type Slot = {
  id: string
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  availableCount: number
  isActive: boolean
  allowedModes: MeetingMode[]
  manualMeetingLink: string | null
  physicalAddress: string | null
}

type BookingResult = {
  booking: {
    id: string
    name: string
    email: string
    phone: string
    subject: string
    notes?: string | null
    meetingMode: MeetingMode
    meetingLink?: string | null
  }
  slot: {
    date: string
    startTime: string
    endTime: string
    physicalAddress?: string | null
  }
}

type AvailabilityDay = {
  date: string
  slots: Slot[]
  totalSlots: number
  availableSlots: number
  bookedSlots: number
}

interface ConsultationFormProps {
  content?: any
  inModal?: boolean
  onClose?: () => void
}

function buildDateWindow(days = 90) {
  const today = new Date()
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return istDateKey(date)
  })
}

function monthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex - 1, 1))
}

function shiftMonth(month: string, delta: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const nextIndex = monthIndex - 1 + delta
  const nextYear = year + Math.floor(nextIndex / 12)
  const normalizedMonth = ((nextIndex % 12) + 12) % 12
  return `${nextYear}-${String(normalizedMonth + 1).padStart(2, '0')}`
}

function buildMonthCells(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  const first = new Date(year, monthIndex - 1, 1)
  const last = new Date(year, monthIndex, 0)
  const startPadding = first.getDay()
  const total = startPadding + last.getDate()
  const cells: (string | null)[] = []

  for (let index = 0; index < total; index += 1) {
    const dayNumber = index - startPadding + 1
    if (dayNumber < 1) {
      cells.push(null)
    } else {
      const date = new Date(year, monthIndex - 1, dayNumber)
      cells.push(istDateKey(date))
    }
  }

  return cells
}

function getDayStatus(day?: AvailabilityDay) {
  const totalCapacity = day?.slots?.reduce((sum, slot) => sum + slot.capacity, 0) || 0
  const availableSlots = day?.availableSlots || 0

  if (!day || totalCapacity <= 0 || availableSlots <= 0) {
    return { tone: 'unavailable' as const, label: 'Closed' }
  }

  const ratio = availableSlots / totalCapacity
  if (ratio < 0.5) {
    return { tone: 'limited' as const, label: 'Limited' }
  }

  return { tone: 'open' as const, label: 'Open' }
}

const surfaceClass =
  'rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]'

export function ConsultationForm({ content, inModal, onClose }: ConsultationFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingAvailability, setLoadingAvailability] = useState(true)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => istDateKey(new Date()))
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('GOOGLE_MEET')
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [slotConfirmed, setSlotConfirmed] = useState(false)
  const [availabilityDays, setAvailabilityDays] = useState<Record<string, AvailabilityDay>>({})
  const [availableModes, setAvailableModes] = useState<MeetingMode[]>(['PHYSICAL', 'GOOGLE_MEET', 'ZOOM'])
  const [visibleMonth, setVisibleMonth] = useState(() => istDateKey(new Date()).slice(0, 7))
  const section = content?.consultation || {}

  const dateWindow = useMemo(() => buildDateWindow(90), [])
  const monthKeys = useMemo(() => Array.from(new Set(dateWindow.map((date) => date.slice(0, 7)))), [dateWindow])

  // On mount: fetch without mode filter to discover which modes have ANY slots
  useEffect(() => {
    let active = true
    const discoverModes = async () => {
      try {
        const firstTwoMonths = monthKeys.slice(0, 2)
        const payloads = await Promise.all(
          firstTwoMonths.map(async (month) => {
            const res = await fetch(`/api/consultation/availability/month?month=${month}`, { credentials: 'same-origin' })
            if (!res.ok) return []
            const payload = await res.json()
            return Array.isArray(payload.days) ? (payload.days as AvailabilityDay[]) : []
          })
        )
        if (!active) return
        const modesFound = new Set<MeetingMode>()
        payloads.flat().forEach((day) => {
          day.slots?.forEach((slot) => {
            slot.allowedModes?.forEach((m) => modesFound.add(m))
          })
        })
        if (modesFound.size > 0) {
          const ordered: MeetingMode[] = (['PHYSICAL', 'GOOGLE_MEET', 'ZOOM'] as MeetingMode[]).filter((m) => modesFound.has(m))
          setAvailableModes(ordered)
          // If the current default mode isn't available, switch to first available
          setMeetingMode((prev) => (modesFound.has(prev) ? prev : ordered[0]))
        }
      } catch {
        // silently fail — fall back to showing all modes
      }
    }
    discoverModes()
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let active = true

    const loadAvailability = async () => {
      setLoadingAvailability(true)
      setAvailabilityError(null)

      try {
        const monthPayloads = await Promise.all(
          monthKeys.map(async (month) => {
            const response = await fetch(`/api/consultation/availability/month?month=${month}&meetingMode=${meetingMode}`, {
              credentials: 'same-origin',
            })

            if (!response.ok) {
              const payload = await response.json().catch(() => ({}))
              throw new Error(payload.error || 'Unable to load available slots')
            }

            const payload = await response.json()
            return Array.isArray(payload.days) ? (payload.days as AvailabilityDay[]) : []
          })
        )

        if (!active) return

        const merged: Record<string, AvailabilityDay> = {}
        monthPayloads.flat().forEach((day) => {
          merged[day.date] = day
        })
        setAvailabilityDays(merged)
      } catch (error) {
        if (!active) return
        setAvailabilityError(error instanceof Error ? error.message : 'Unable to load available slots')
        setAvailabilityDays({})
      } finally {
        if (active) {
          setLoadingAvailability(false)
        }
      }
    }

    loadAvailability()

    return () => {
      active = false
    }
  }, [monthKeys, meetingMode])

  const dateOptions = useMemo(
    () =>
      dateWindow.map((date) => {
        const day = availabilityDays[date]
        return {
          date,
          label: formatIstDate(parseIstDate(date)),
          available: Boolean(day && day.availableSlots > 0),
        }
      }),
    [availabilityDays, dateWindow]
  )

  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth])
  useEffect(() => {
    const selectedOption = dateOptions.find((option) => option.date === selectedDate)
    if (selectedOption?.available) return

    const firstAvailable = dateOptions.find((option) => option.available)
    if (firstAvailable) {
      setSelectedDate(firstAvailable.date)
      setVisibleMonth(firstAvailable.date.slice(0, 7))
    }
  }, [dateOptions, selectedDate])

  useEffect(() => {
    setSelectedSlotId('')
    setSlotConfirmed(false)
    setBookingError(null)
  }, [selectedDate, meetingMode])

  const selectedDay = availabilityDays[selectedDate]
  const filteredSlots = useMemo(
    () => (selectedDay?.slots || []).filter((slot) => slot.isActive && slot.availableCount > 0 && slot.allowedModes.includes(meetingMode)),
    [selectedDay, meetingMode]
  )

  const selectedSlot = useMemo(
    () => filteredSlots.find((slot) => slot.id === selectedSlotId) || null,
    [filteredSlots, selectedSlotId]
  )

  const meetingDetails = useMemo(() => {
    if (!selectedSlot) return ''
    if (meetingMode === 'PHYSICAL') {
      return selectedSlot.physicalAddress || 'Physical address will be shared after confirmation.'
    }

    return selectedSlot.manualMeetingLink || generateMeetingLink(meetingMode, 'preview-booking', selectedSlot.id) || 'Meeting link will be shared after confirmation.'
  }, [meetingMode, selectedSlot])

  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlot) return ''
    return `${selectedSlot.startTime} - ${selectedSlot.endTime} on ${formatIstDate(parseIstDate(selectedDate))}`
  }, [selectedDate, selectedSlot])

  const confirmSlot = () => {
    if (!selectedSlot) return
    setSlotConfirmed(true)
    setBookingError(null)
  }

  const resetSlot = () => {
    setSelectedSlotId('')
    setSlotConfirmed(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBookingError(null)

    if (!slotConfirmed || !selectedSlot) {
      setBookingError('Confirm an available slot before submitting.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('date', selectedDate)
      formData.set('slotId', selectedSlot.id)
      formData.set('meetingMode', meetingMode)

      const result = (await submitBooking(formData)) as BookingResult
      setBookingResult(result)
      setSuccess(true)
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Failed to book consultation')
    } finally {
      setLoading(false)
    }
  }

  const bookingSuccessMeetingValue = bookingResult
    ? bookingResult.booking.meetingMode === 'PHYSICAL'
      ? bookingResult.slot.physicalAddress || bookingResult.booking.meetingLink || 'Office address to be shared'
      : bookingResult.booking.meetingLink || 'Link will be shared by email'
    : ''

  if (success && bookingResult) {
    return (
      <div className={inModal ? 'p-3 sm:p-4' : 'min-h-screen bg-white px-4 py-10 sm:px-6 lg:px-8'}>
        <div className={`mx-auto max-w-xl ${surfaceClass} p-6 text-center sm:p-8`}>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mb-3 text-2xl font-black uppercase tracking-tighter text-[#0a192f]">
            {section.form?.successTitle || 'REQUEST SENT'}
          </h2>
          <p className="mb-6 text-sm leading-6 text-slate-600">
            {section.form?.successMessage || 'We have received your consultation request. Our office will contact you shortly to confirm the schedule.'}
          </p>
          <div className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</span>
              <span className="text-sm font-bold text-[#0a192f]">{formatIstDate(parseIstDate(bookingResult.slot.date))}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</span>
              <span className="text-sm font-bold text-[#0a192f]">{bookingResult.slot.startTime} - {bookingResult.slot.endTime}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode</span>
              <span className="text-sm font-bold text-[#0a192f]">{bookingResult.booking.meetingMode.replace('_', ' ')}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5" />
                Scheduled Link / Location
              </span>
              <div className="text-sm font-bold text-[#0a192f] break-all">{bookingSuccessMeetingValue}</div>
            </div>
          </div>
          <Button
            onClick={inModal ? onClose : () => window.location.href = '/'}
            className="mt-6 w-full h-14 bg-[#0a192f] rounded-2xl font-black tracking-widest uppercase"
          >
            {inModal ? 'CLOSE' : (section.form?.homeText || 'RETURN HOME')}
          </Button>
          {bookingResult.booking.meetingMode !== 'PHYSICAL' && (
            <Button onClick={() => window.location.href = `/meeting/${bookingResult.booking.id}`} className="mt-3 w-full h-14 bg-[#c5a059] text-[#0a192f] rounded-2xl font-black tracking-widest uppercase">
              OPEN MEETING WORKSPACE
            </Button>
          )}
        </div>
      </div>
    )
  }

  const bookingPanel = (
    <div className={`relative ${surfaceClass} p-4 sm:p-5`}>
      {selectedSlot && !slotConfirmed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-white/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[26px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c5a059]">Confirm Slot</p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-[#0a192f]">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetSlot}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:text-[#0a192f]"
                aria-label="Close slot confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <LinkIcon className="h-4 w-4 text-[#0a192f]" />
                Meeting details
              </div>
              <div className="mt-2 break-all text-sm font-bold text-[#0a192f]">
                {meetingDetails}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Button
                type="button"
                onClick={confirmSlot}
                className="h-12 rounded-2xl bg-[#0a192f] font-black uppercase tracking-widest text-white hover:bg-[#c5a059] hover:text-[#0a192f]"
              >
                Confirm and Continue
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetSlot}
                className="h-12 rounded-2xl border-slate-200 font-black uppercase tracking-widest text-slate-600"
              >
                Change Slot
              </Button>
            </div>
          </div>
        </div>
      )} 

      <div className="space-y-5">
        <div className={`${surfaceClass} p-3 sm:p-4`}>
          <div className="mb-4 flex flex-col gap-3 text-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#b8872f]">Consultation Date *</p>
              <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-[#0a192f]">
                {monthLabel(visibleMonth)}
              </h3>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setVisibleMonth((value) => shiftMonth(value, -1))}
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#c5a059]/40 hover:text-[#0a192f]"
                aria-label="Previous month"
              >
                <Calendar className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => setVisibleMonth((value) => shiftMonth(value, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#c5a059]/40 hover:text-[#0a192f]"
                aria-label="Next month"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Limited
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Closed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-1 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                {day}
              </div>
            ))}

            {monthCells.map((date, index) => {
              if (!date) {
                return <div key={`blank-${index}`} className="min-h-[68px] rounded-2xl border border-dashed border-slate-100 bg-slate-50/50" />
              }

              const day = availabilityDays[date]
              const isSelected = selectedDate === date
              const hasSlots = Boolean(day && day.availableSlots > 0)
              const status = getDayStatus(day)
              const isLimited = status.tone === 'limited'
              const isOpen = status.tone === 'open'
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!hasSlots}
                  onClick={() => hasSlots && setSelectedDate(date)}
                  className={`min-h-[68px] rounded-2xl border p-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#c5a059] bg-[#c5a059]/5 shadow-sm ring-1 ring-[#c5a059]/25'
                      : status.tone === 'unavailable'
                        ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-300'
                        : isLimited
                          ? 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-sm'
                          : isOpen
                            ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-black ${
                        status.tone === 'unavailable'
                          ? 'border-red-200 bg-white text-red-400'
                          : isLimited
                            ? 'border-amber-400 bg-white text-amber-700'
                            : 'border-emerald-300 bg-white text-emerald-700'
                      }`}
                    >
                      {Number(date.slice(-2))}
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${
                      status.tone === 'unavailable'
                        ? 'bg-red-100 text-red-600'
                        : isLimited
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {hasSlots ? `${day?.availableSlots || 0} open` : 'Closed'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      {day?.slots?.length || 0} slot{(day?.slots?.length || 0) === 1 ? '' : 's'}
                    </div>
                    <div className={`text-[9px] font-medium ${
                      status.tone === 'unavailable' ? 'text-red-400' : isLimited ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {hasSlots ? 'Tap to see times' : 'No slots available'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-600">{section.form?.meetingModeLabel || 'Meeting Mode *'}</label>
          <div className={`grid gap-2 ${availableModes.length === 1 ? 'grid-cols-1' : availableModes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {availableModes.map((mode) => (
              <label key={mode} className="relative">
                <input
                  type="radio"
                  name="meetingMode"
                  value={mode}
                  checked={meetingMode === mode}
                  onChange={() => setMeetingMode(mode)}
                  required
                  className="peer sr-only"
                />
                <div className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition-all peer-checked:bg-[#0a192f] peer-checked:text-white">
                  <span className="text-[8px] font-black uppercase tracking-widest">{mode.replace(/_/g, ' ')}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Available Slots *</label>
            {loadingAvailability && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading...</span>}
          </div>
          {availabilityError && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {availabilityError}
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Clock className="h-4 w-4 text-[#0a192f]" />
                Selected Date
              </div>
              <div className="mt-2 text-sm font-bold text-[#0a192f]">
                {formatIstDate(parseIstDate(selectedDate))}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {selectedDay && selectedDay.availableSlots > 0
                  ? `${selectedDay.availableSlots} seat${selectedDay.availableSlots === 1 ? '' : 's'} available`
                  : 'No slots available on this date'}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available Slots *</label>
                {loadingAvailability && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading...</span>}
              </div>
              {availabilityError && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  {availabilityError}
                </div>
              )}
              <div className="mt-3 grid max-h-64 grid-cols-1 gap-2.5 overflow-y-auto pr-1">
                {!loadingAvailability && selectedDay && selectedDay.availableSlots === 0 && (
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                    No slots are available on this date.
                  </div>
                )}
                {!loadingAvailability && selectedDay && selectedDay.availableSlots > 0 && filteredSlots.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-400">
                    No available slot found for this date and meeting mode.
                  </div>
                )}
                {filteredSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => {
                      setSelectedSlotId(slot.id)
                      setSlotConfirmed(false)
                    }}
                    className={`rounded-3xl border p-3.5 text-left transition-all ${
                      selectedSlot?.id === slot.id
                        ? 'border-[#c5a059] bg-[#c5a059]/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-black uppercase tracking-tight text-[#0f172a]">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                          {slot.availableCount} seat{slot.availableCount === 1 ? '' : 's'} left
                        </div>
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#c5a059]">
                        Select
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Clock className="h-4 w-4 text-[#0a192f]" />
            Selected Slot
          </div>
          <div className="mt-2 text-sm font-bold text-[#0a192f]">
            {selectedSlotLabel || 'Pick a slot to continue'}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {meetingMode === 'PHYSICAL'
              ? 'The physical address will be confirmed in the popup.'
              : 'Meeting details will appear after confirmation.'}
          </div>
        </div>

        {bookingError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{bookingError}</div>
        )}

        {!slotConfirmed ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 text-sm text-slate-500">
            Select an available slot to open the confirmation popup, then continue to the form.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Full Identity *</label>
              <input name="name" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" placeholder="Your name" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Email *</label>
                <input type="email" name="email" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" placeholder="contact@example.com" />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Phone *</label>
                <input name="phone" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" placeholder="+91" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Case Subject *</label>
              <input name="subject" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" placeholder="Corporate Law" />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Case Brief *</label>
              <textarea name="notes" required rows={4} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" placeholder="Provide context about your legal requirements..." />
            </div>

            <Button disabled={loading} type="submit" className="h-14 w-full rounded-2xl bg-[#0a192f] font-black uppercase tracking-widest text-white transition-all hover:bg-[#c5a059] hover:text-[#0a192f]">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-[#c5a059]" /> : (section.form?.submitText || 'BOOK PRIORITY SLOT')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )

  if (inModal) {
    return <div className="bg-white p-3 sm:p-4">{bookingPanel}</div>
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="space-y-6">
          <div className={`${surfaceClass} p-5 text-center sm:p-7`}>
            <div className="inline-flex items-center justify-center rounded-full border border-[#c5a059]/20 bg-[#c5a059]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#c5a059]">
              {section.hero?.badge || 'PRIORITY BOOKING'}
            </div>
            <h1 className="mt-5 text-3xl font-black uppercase tracking-tight text-[#0a192f] sm:text-5xl">
              {section.hero?.title || 'LEGAL CONSULTATION'}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg">
              {section.hero?.subtitle || 'Expert legal guidance delivered via your preferred mode of communication.'}
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4">
            {[
              { Icon: Video, title: 'Virtual Meeting', desc: 'Secure Google Meet or Zoom sessions.' },
              { Icon: MapPin, title: 'In-Person', desc: 'Visit our chambers for a face-to-face brief.' },
              { Icon: Calendar, title: 'Flexible Timing', desc: 'Available Mon-Fri, 10:00 AM - 6:00 PM.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 rounded-[22px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0a192f]/5 text-[#0a192f]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#0a192f]">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-full">{bookingPanel}</div>
      </div>
    </div>
  )
}
