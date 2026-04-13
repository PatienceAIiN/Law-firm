'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, Calendar as CalendarIcon } from 'lucide-react'
import { AdminDialog } from './admin-dialog'
import { cn } from '@/lib/utils'

type Slot = {
  id: string
  startTime: string
  endTime: string
  startTimeValue: string
  endTimeValue: string
  capacity: number
  bookedCount: number
  availableCount: number
  isActive: boolean
  allowedModes: string[]
  manualMeetingLink: string | null
  physicalAddress: string | null
}

type Day = {
  date: string
  slots: Slot[]
  totalSlots: number
  availableSlots: number
  bookedSlots: number
}

interface AvailabilityCalendarProps {
  initialMonth: string
  initialDays: Day[]
}

function monthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, monthIndex - 1, 1))
}

function dayKeyFromDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const year = parts.find((p) => p.type === 'year')?.value || '1970'
  const month = parts.find((p) => p.type === 'month')?.value || '01'
  const day = parts.find((p) => p.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

function shiftMonth(month: string, delta: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const nextIndex = monthIndex - 1 + delta
  const nextYear = year + Math.floor(nextIndex / 12)
  const normalizedMonth = ((nextIndex % 12) + 12) % 12
  return `${nextYear}-${String(normalizedMonth + 1).padStart(2, '0')}`
}

export function AvailabilityCalendar({ initialMonth, initialDays }: AvailabilityCalendarProps) {
  const [month, setMonth] = useState(initialMonth)
  const [days, setDays] = useState<Day[]>(initialDays)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingSlots, setEditingSlots] = useState<Record<string, Slot>>({})
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '09:00',
    endTime: '09:30',
    capacity: '1',
    allowedModes: ['PHYSICAL', 'GOOGLE_MEET', 'ZOOM'] as string[],
    manualMeetingLink: '',
    physicalAddress: ''
  })

  const selectedDay = useMemo(
    () => days.find((day) => day.date === selectedDate) || null,
    [days, selectedDate]
  )

  const daysMap = useMemo(() => new Map(days.map((day) => [day.date, day])), [days])

  const monthDates = useMemo(() => {
    const [year, monthIndex] = month.split('-').map(Number)
    const first = new Date(year, monthIndex - 1, 1)
    const last = new Date(year, monthIndex, 0)
    const startPadding = first.getDay()
    const total = startPadding + last.getDate()
    const cells = []

    for (let index = 0; index < total; index += 1) {
      const dayNumber = index - startPadding + 1
      if (dayNumber < 1) {
        cells.push(null)
      } else {
        const date = new Date(year, monthIndex - 1, dayNumber)
        cells.push(dayKeyFromDate(date))
      }
    }

    return cells
  }, [month])

  const loadMonth = async (targetMonth: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/availability?month=${targetMonth}`, {
        credentials: 'same-origin'
      })
      if (!response.ok) {
        throw new Error('Unable to load availability')
      }
      const data = await response.json()
      setMonth(targetMonth)
      setDays(data.days || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load availability')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setNewSlot((prev) => ({
      ...prev,
      date: selectedDate || `${month}-01`
    }))
  }, [selectedDate, month])

  const openDay = (date: string) => {
    setSelectedDate(date)
    setShowModal(true)
    setEditingSlotId(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingSlotId(null)
    setEditingSlots({})
  }

  const selectedSlots = selectedDay?.slots || []

  const submitNewSlot = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(newSlot)
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to create slot')
      }
      await loadMonth(month)
      setShowModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create slot')
    } finally {
      setLoading(false)
    }
  }

  const updateSlot = async (slotId: string, slot: Slot) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/availability/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          date: selectedDate,
          startTime: slot.startTimeValue,
          endTime: slot.endTimeValue,
          capacity: slot.capacity,
          allowedModes: slot.allowedModes,
          manualMeetingLink: slot.manualMeetingLink,
          physicalAddress: slot.physicalAddress,
          isActive: slot.isActive
        })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to update slot')
      }
      await loadMonth(month)
      setEditingSlotId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update slot')
    } finally {
      setLoading(false)
    }
  }

  const deleteSlot = async (slotId: string) => {
    if (!window.confirm('Delete this slot?')) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/availability/${slotId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to delete slot')
      }
      await loadMonth(month)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete slot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#0a192f] uppercase tracking-tighter">Availability Calendar</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Manage consultation slots by day</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadMonth(shiftMonth(month, -1))} className="p-3 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-black text-[#0a192f] uppercase tracking-widest">
            {monthLabel(month)}
          </div>
          <button onClick={() => loadMonth(shiftMonth(month, 1))} className="p-3 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">{error}</div>
      )}

      <div className="grid grid-cols-7 gap-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 py-1">{day}</div>
        ))}

        {monthDates.map((date, index) => {
          if (!date) {
            return <div key={`blank-${index}`} className="rounded-3xl bg-white/40 border border-dashed border-gray-100 min-h-28" />
          }

          const day = daysMap.get(date)
          const isSelected = selectedDate === date
          return (
            <button
              key={date}
              onClick={() => openDay(date)}
              className={cn(
                'text-left rounded-3xl p-4 min-h-28 border transition-all bg-white hover:shadow-lg',
                isSelected ? 'border-[#c5a059] shadow-lg' : 'border-gray-100'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-lg font-black text-[#0a192f]">{Number(date.slice(-2))}</div>
                <CalendarIcon className="w-4 h-4 text-[#c5a059]" />
              </div>
              {day ? (
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#0a192f]">
                    {day.totalSlots} slots
                  </div>
                  <div className="text-[10px] font-bold text-gray-400">
                    {day.availableSlots} seats open
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No slots</div>
              )}
            </button>
          )
        })}
      </div>

      <AdminDialog
        isOpen={showModal}
        onClose={closeModal}
        title={selectedDate || 'Availability'}
        description={selectedDay ? `${selectedDay.totalSlots} slots, ${selectedDay.availableSlots} open seats` : 'No slots scheduled'}
        isLoading={loading}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Slots</div>
              <div className="text-2xl font-black text-[#0a192f]">{selectedDay?.totalSlots || 0}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Available Seats</div>
              <div className="text-2xl font-black text-[#0a192f]">{selectedDay?.availableSlots || 0}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Booked Seats</div>
              <div className="text-2xl font-black text-[#0a192f]">{selectedDay?.bookedSlots || 0}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Slots</h3>
            {selectedSlots.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-100 p-6 text-center text-gray-400 text-sm">
                No slots configured for this date.
              </div>
            )}
            {selectedSlots.map((slot) => {
              const isEditing = editingSlotId === slot.id
              const draft = editingSlots[slot.id] || slot
              return (
                <div key={slot.id} className="rounded-3xl border border-gray-100 p-4 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-[#0a192f] uppercase tracking-tighter">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {slot.bookedCount}/{slot.capacity} booked
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingSlotId(isEditing ? null : slot.id)} className="px-3 py-2 rounded-xl bg-gray-50 text-xs font-black uppercase tracking-widest hover:bg-gray-100">
                        {isEditing ? 'Close' : 'Edit'}
                      </button>
                      <button onClick={() => deleteSlot(slot.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={draft.startTimeValue}
                        onChange={(e) => setEditingSlots((prev) => ({
                          ...prev,
                          [slot.id]: { ...draft, startTimeValue: e.target.value }
                        }))}
                        className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                        type="time"
                      />
                      <input
                        value={draft.endTimeValue}
                        onChange={(e) => setEditingSlots((prev) => ({
                          ...prev,
                          [slot.id]: { ...draft, endTimeValue: e.target.value }
                        }))}
                        className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                        type="time"
                      />
                      <input
                        value={draft.capacity}
                        onChange={(e) => setEditingSlots((prev) => ({
                          ...prev,
                          [slot.id]: { ...draft, capacity: Number(e.target.value) }
                        }))}
                        className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                        type="number"
                        min={1}
                      />
                      <input
                        value={draft.manualMeetingLink || ''}
                        onChange={(e) => setEditingSlots((prev) => ({
                          ...prev,
                          [slot.id]: { ...draft, manualMeetingLink: e.target.value }
                        }))}
                        placeholder="Meeting link / note"
                        className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                      />
                      <input
                        value={draft.physicalAddress || ''}
                        onChange={(e) => setEditingSlots((prev) => ({
                          ...prev,
                          [slot.id]: { ...draft, physicalAddress: e.target.value }
                        }))}
                        placeholder="Physical address"
                        className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold md:col-span-2"
                      />
                      <button
                        onClick={() => updateSlot(slot.id, draft)}
                        className="md:col-span-2 w-full bg-[#0a192f] text-white p-3 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Slot
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slot.allowedModes.map((mode) => (
                        <span key={mode} className="px-3 py-1 rounded-full bg-gray-50 text-[10px] font-black uppercase tracking-widest text-[#0a192f]">
                          {mode.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Add Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newSlot.date} onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })} type="date" className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold" />
              <input value={newSlot.startTime} onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} type="time" className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold" />
              <input value={newSlot.endTime} onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} type="time" className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold" />
              <input value={newSlot.capacity} onChange={(e) => setNewSlot({ ...newSlot, capacity: e.target.value })} type="number" min={1} className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold" />
              <input value={newSlot.manualMeetingLink} onChange={(e) => setNewSlot({ ...newSlot, manualMeetingLink: e.target.value })} placeholder="Meeting link / note" className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold md:col-span-2" />
              <input value={newSlot.physicalAddress} onChange={(e) => setNewSlot({ ...newSlot, physicalAddress: e.target.value })} placeholder="Physical address" className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold md:col-span-2" />
            </div>
            <div className="flex flex-wrap gap-2">
              {['PHYSICAL', 'GOOGLE_MEET', 'ZOOM'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setNewSlot((prev) => ({
                      ...prev,
                      allowedModes: prev.allowedModes.includes(mode)
                        ? prev.allowedModes.filter((item) => item !== mode)
                        : [...prev.allowedModes, mode]
                    }))
                  }}
                  className={cn(
                    'px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border',
                    newSlot.allowedModes.includes(mode)
                      ? 'bg-[#0a192f] text-white border-[#0a192f]'
                      : 'bg-white text-gray-400 border-gray-100'
                  )}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button onClick={submitNewSlot} className="w-full bg-[#c5a059] text-[#0a192f] p-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Slot
            </button>
          </div>
        </div>
      </AdminDialog>
    </div>
  )
}
