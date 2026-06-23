'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Calendar, Clock } from 'lucide-react'

type Slot = { id: string; startTime: string; endTime: string; seatsLeft: number; modes: string[] }
type Day = { date: string; slots: Slot[] }

export function BookConsultation({ slug }: { slug: string }) {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ meetingLink: string | null } | false>(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/t/${slug}/api/availability`).then(async (r) => {
      const d = await r.json().catch(() => ({ days: [] }))
      setDays(d.days || [])
    }).finally(() => setLoading(false))
  }, [slug])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true); setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/t/${slug}/api/book`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slotId: selected.id,
          name: fd.get('name'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          subject: fd.get('subject'),
          meetingMode: fd.get('meetingMode'),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      setDone({ meetingLink: data.meetingLink || null })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <p className="mt-3 text-lg font-semibold text-white">Booking confirmed</p>
        <p className="mt-1 text-sm text-white/70">We've emailed you the details.</p>
        {done.meetingLink && (
          <a
            href={done.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#c9a227] px-4 py-2 text-xs font-semibold text-[#0b0f17] hover:bg-[#d8b33a]"
          >
            Join meeting
          </a>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-white/70"><Loader2 className="h-4 w-4 animate-spin" /> Loading slots…</div>
  }

  if (days.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
        No slots available right now. Use the contact form below and we'll reach out.
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        {days.map((d) => (
          <div key={d.date} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="h-4 w-4 text-[#c9a227]" />
              {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
            <div className="flex flex-wrap gap-2">
              {d.slots.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <Clock className="h-3.5 w-3.5 text-[#c9a227]" />
                  {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="ml-1 text-[10px] font-normal text-white/60">({s.seatsLeft} left)</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">
          {new Date(selected.startTime).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          <span className="text-white/50"> – {new Date(selected.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <button type="button" onClick={() => setSelected(null)} className="text-xs text-white/60 hover:text-white">Pick another</button>
      </div>
      <input name="name" required placeholder="Full name" className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none" />
      <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none" />
      <input name="phone" placeholder="Phone (optional)" className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none" />
      <input name="subject" placeholder="Matter / subject" className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none" />
      <select name="meetingMode" defaultValue={selected.modes.includes('VIRTUAL') ? 'VIRTUAL' : selected.modes[0]} className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:outline-none">
        {selected.modes.map((m) => (
          <option key={m} value={m} className="bg-[#11151f]">
            {m === 'PHYSICAL' ? 'In person — at the office' : 'Online video call'}
          </option>
        ))}
      </select>
      {error && <div className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{error}</div>}
      <button disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#14203E] hover:bg-white/90 disabled:opacity-60">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Confirm booking
      </button>
    </form>
  )
}
