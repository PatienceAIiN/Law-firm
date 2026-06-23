'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'

export function ChangePasswordCard({ slug }: { slug: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    if (next !== confirm) { setStatus({ ok: false, message: 'Passwords do not match' }); return }
    if (next.length < 8) { setStatus({ ok: false, message: 'At least 8 characters' }); return }
    setBusy(true)
    try {
      const res = await fetch(`/team/${slug}/admin/api/change-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setStatus({ ok: true, message: 'Password updated.' })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (e: any) {
      setStatus({ ok: false, message: e?.message || 'Failed' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f] sm:max-w-md">
      <PasswordInput required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
      <PasswordInput required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (≥ 8 chars)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
      <PasswordInput required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
      {status && (
        <div className={`rounded-lg px-3 py-2 text-sm ${status.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {status.message}
        </div>
      )}
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Update password
      </button>
    </form>
  )
}
