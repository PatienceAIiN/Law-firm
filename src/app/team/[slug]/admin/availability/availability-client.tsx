'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, CalendarClock } from 'lucide-react'
import { addSlot, deleteSlot } from './actions'

type Booking = { id: string; name: string; email: string; phone: string; status: string; meetingMode: string }
type Slot = { id: string; startTime: string; endTime: string; capacity: number; bookedCount: number; bookings: Booking[] }
type Day = { id: string; date: string; advocateName: string | null; slots: Slot[] }
type AdvocateOption = { id: string; name: string }

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

type Slot2 = Slot & { allowedModes?: string | null; physicalAddress?: string | null }
type Day2 = Omit<Day, 'slots'> & { slots: Slot2[] }

export function TenantAvailabilityClient({ slug, days, advocates }: { slug: string; days: Day2[]; advocates: AdvocateOption[] }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  // Track the selected mode to conditionally render the address field.
  const [modes, setModes] = useState<string>('VIRTUAL,PHYSICAL')
  const requiresAddress = modes.includes('PHYSICAL')

  const onAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (requiresAddress && !((fd.get('physicalAddress') as string) || '').trim()) {
      alert('Please add the meeting address for in-person slots.')
      return
    }
    start(async () => { await addSlot(slug, fd); (e.target as HTMLFormElement).reset(); setModes('VIRTUAL,PHYSICAL'); router.refresh() })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <div className="mb-3 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-slate-400" /><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Add a consultation slot</h2></div>
        <form onSubmit={onAdd} className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <input name="date" type="date" required className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="startTime" type="time" required defaultValue="10:00" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="endTime" type="time" required defaultValue="10:30" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <select name="advocateId" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white">
            <option value="">Any Advocate (Firm Level)</option>
            {advocates.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select
            name="modes"
            value={modes}
            onChange={(e) => setModes(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white"
          >
            <option value="VIRTUAL,PHYSICAL">Both (Virtual & In-Person)</option>
            <option value="VIRTUAL">Virtual Only</option>
            <option value="PHYSICAL">In-Person Only</option>
          </select>
          <input name="capacity" type="number" min={1} defaultValue={1} placeholder="Seats" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          {requiresAddress && (
            <input
              name="physicalAddress"
              maxLength={250}
              required
              placeholder="In-person meeting address (firm / chamber, shown to the client)"
              className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-5 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
          )}
          <button disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-accent disabled:opacity-60">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add slot
          </button>
        </form>
        {!requiresAddress && (
          <p className="mt-2 text-[11px] text-slate-500">
            Virtual slots get an auto-generated meeting link on booking. For in-person slots, you set the meeting address here — the client only picks a time.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {days.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-[#11151f]">
            No slots yet. Add one above and clients can book it from your public site.
          </div>
        ) : days.map((d) => (
          <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">{d.advocateName || 'Firm (Any)'}</span>
            </div>
            {d.slots.length === 0 ? <p className="mt-2 text-xs text-slate-500">No slots.</p> : (
              <ul className="mt-3 space-y-2">
                {d.slots.map((s) => (
                  <li key={s.id} className="rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{time(s.startTime)} – {time(s.endTime)}</span>
                        <span className="ml-3 text-xs text-slate-500">{s.bookedCount}/{s.capacity} booked</span>
                        {s.bookedCount > 0 ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Booked</span>
                        ) : (
                          <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">Available</span>
                        )}
                      </div>
                      <form action={async () => { await deleteSlot(slug, s.id); router.refresh() }}>
                        <button className="rounded-md p-1 text-rose-500 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                      </form>
                    </div>
                    {s.bookings.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                        {s.bookings.map((b) => (
                          <li key={b.id} className="flex items-center justify-between">
                            <span>{b.name} <span className="text-slate-400">· {b.email}</span></span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-200">{b.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
