'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'

interface ManualSchedulerProps {
  scheduleAction: (formData: FormData) => Promise<void>
}

export function ManualScheduler({ scheduleAction }: ManualSchedulerProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

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
    <div className="rounded-2xl border border-[#e8e3dc] bg-[#faf8f5] p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Client Name *</label>
            <input name="name" required placeholder="Full name" className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Client Email *</label>
            <input name="email" type="email" required placeholder="client@email.com" className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Phone</label>
            <input name="phone" type="tel" placeholder="+91..." className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Subject / Case Brief *</label>
            <input name="subject" required placeholder="e.g. Property dispute" className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Date *</label>
            <input name="date" type="date" required className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Start *</label>
              <input name="startTime" type="time" required className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">End *</label>
              <input name="endTime" type="time" required className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Meeting Mode *</label>
            <select name="meetingMode" required className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10">
              <option value="GOOGLE_MEET">Google Meet</option>
              <option value="ZOOM">Zoom</option>
              <option value="PHYSICAL">In-Person</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Meeting Link / Address</label>
            <input name="meetingLink" placeholder="https://meet.google.com/... or office address" className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1a1208] text-white text-sm font-semibold hover:bg-[#2d1f0d] transition-colors disabled:opacity-60"
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
