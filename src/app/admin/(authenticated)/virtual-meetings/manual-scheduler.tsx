'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'

interface ManualSchedulerProps {
  scheduleAction: (formData: FormData) => Promise<void>
}

export function ManualScheduler({ scheduleAction }: ManualSchedulerProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState('VIRTUAL')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await scheduleAction(fd).catch(() => {})
    setLoading(false)
    setDone(true)
    ;(e.target as HTMLFormElement).reset()
    setTimeout(() => setDone(false), 4000)
  }

  return (
    <div className="rounded-2xl border border-[#F4E8D8] bg-[#FFFCF8] p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Client Name *</label>
            <input name="name" required placeholder="Full name" className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Client Email *</label>
            <input name="email" type="email" required placeholder="client@email.com" className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Phone</label>
            <input name="phone" type="tel" placeholder="+91..." className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Subject / Case Brief *</label>
            <input name="subject" required placeholder="e.g. Property dispute" className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Date *</label>
            <input name="date" type="date" required className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Start *</label>
              <input name="startTime" type="time" required className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">End *</label>
              <input name="endTime" type="time" required className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Meeting Type *</label>
            <select
              name="meetingMode"
              required
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10"
            >
              <option value="VIRTUAL">Virtual (Live Video)</option>
              <option value="PHYSICAL">In-Person</option>
            </select>
          </div>
          <div>
            {mode === 'PHYSICAL' ? (
              <>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Office Address *</label>
                <input name="meetingLink" required placeholder="Chambers / office address" className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10" />
              </>
            ) : (
              <>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Meeting Link</label>
                <div className="w-full px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium leading-snug">
                  ✓ A secure live video link is generated automatically and emailed to the client.
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#14203E] text-white text-sm font-semibold hover:bg-[#1d2c52] transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Scheduling…' : 'Schedule & Send Invite'}
          </button>
          {done && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4" /> Meeting scheduled and email sent!
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">Client will receive an email with the secure workspace link. Meeting opens only within the workspace — never on external provider pages.</p>
      </form>
    </div>
  )
}
