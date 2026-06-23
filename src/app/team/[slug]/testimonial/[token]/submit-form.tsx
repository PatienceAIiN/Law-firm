'use client'

import { useState, useTransition } from 'react'
import { Star, CheckCircle2, Loader2 } from 'lucide-react'
import { submitTestimonial } from './actions'

export function SubmitTestimonialForm({ slug, token, clientName }: { slug: string; token: string; clientName: string }) {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState('')
  const [role, setRole] = useState('')
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim().length < 10) { setError('Please write at least 10 characters.'); return }
    setError('')
    start(async () => {
      const res = await submitTestimonial(slug, token, { content: content.trim(), rating, role: role.trim() })
      if (!res.ok) { setError(res.error || 'Failed'); return }
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="mt-6 rounded-lg bg-emerald-50 p-6 text-center text-sm text-emerald-700">
        <CheckCircle2 className="mx-auto h-8 w-8" />
        <p className="mt-2 font-semibold">Thanks, {clientName} — sent for review.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Rating</p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-1"
              aria-label={`${n} stars`}
            >
              <Star
                className={`h-7 w-7 transition ${
                  (hover || rating) >= n ? 'fill-[#c9a227] text-[#c9a227]' : 'text-slate-300 dark:text-white/20'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Your role (optional, e.g. Founder, Property Owner)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        minLength={10}
        rows={5}
        placeholder="A few words about your experience…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
      />
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? 'Sending…' : 'Send testimonial'}
      </button>
    </form>
  )
}
