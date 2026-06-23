'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { activateLawyer } from './actions'
import { PasswordInput } from '@/components/ui/password-input'

export function ActivateForm({ slug, token, email }: { slug: string; token: string; email: string }) {
  const [pending, start] = useTransition()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pw !== confirm) { setError('Passwords do not match'); return }
    if (pw.length < 8) { setError('Use at least 8 characters'); return }
    start(async () => {
      const res = await activateLawyer(slug, token, pw)
      if (!res.ok) { setError(res.error || 'Activation failed'); return }
      window.location.href = `/t/${slug}/lawyer/login`
    })
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <input
        value={email}
        readOnly
        className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
      />
      <PasswordInput
        required
        minLength={8}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="New password (≥ 8 characters)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
      />
      <PasswordInput
        required
        minLength={8}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm password"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
      />
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? 'Activating…' : 'Activate & continue'}
      </button>
    </form>
  )
}
