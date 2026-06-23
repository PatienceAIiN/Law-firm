'use client'

import { useState } from 'react'
import { Loader2, X, CheckCircle2 } from 'lucide-react'

type Props = { onClose: () => void }

export function SaasContactModal({ onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(''); setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/saas-contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: fd.get('fullName'),
          email: fd.get('email'),
          subject: fd.get('subject'),
          message: fd.get('message'),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setDone(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to send')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[#F4E8D8] bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#11151f]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#14203E] dark:text-white">Contact Patience AI</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="rounded-xl bg-emerald-50 p-6 text-center text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8" />
            Thanks — we'll get back to you shortly.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send us a note — sales, support, partnerships. We'll reply by email.
            </p>
            <input
              name="fullName"
              required
              placeholder="Your name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <input
              name="subject"
              placeholder="Subject (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Your message"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14203E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
