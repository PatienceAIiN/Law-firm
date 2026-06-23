'use client'

import { useState, useTransition } from 'react'
import { submitTenantContact } from './contact-action'
import { Loader2, CheckCircle2 } from 'lucide-react'

export function TenantContactForm({ slug }: { slug: string }) {
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const res = await submitTenantContact(slug, fd)
      if (res.ok) setDone(true)
      else setError(res.error || 'Submission failed')
    })
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl bg-white/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <p className="mt-3 text-base font-semibold">Thanks — we'll be in touch shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <input
        name="fullName"
        required
        placeholder="Full name"
        className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
      />
      <input
        name="subject"
        required
        placeholder="Subject"
        className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
      />
      <textarea
        name="message"
        rows={5}
        required
        placeholder="How can we help?"
        className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
      />
      {error && <div className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{error}</div>}
      <button
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-white/90 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send message
      </button>
    </form>
  )
}
