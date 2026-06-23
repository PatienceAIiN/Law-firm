'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

type Mode = 'site' | 'admin' | 'lawyer'

export function OpenWorkspace({ variant = 'inline' }: { variant?: 'inline' | 'card' }) {
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<Mode>('admin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/workspace-lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Workspace not found')
      const path = mode === 'site' ? `/t/${data.slug}` : mode === 'lawyer' ? `/t/${data.slug}/lawyer/login` : `/t/${data.slug}/admin/login`
      window.location.href = path
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const isCard = variant === 'card'

  return (
    <form
      onSubmit={submit}
      className={
        isCard
          ? 'mx-auto mt-10 max-w-xl rounded-2xl border border-[#14203E]/10 bg-white/85 p-5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#11151f]/80'
          : 'flex flex-col gap-2 sm:flex-row sm:items-center'
      }
    >
      <div className={isCard ? 'mb-3 text-center' : 'hidden'}>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#14203E]/70 dark:text-white/80">Open your workspace</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Type your firm name or workspace URL.</p>
      </div>

      <div className={isCard ? 'flex flex-col gap-2 sm:flex-row sm:items-center' : 'flex flex-1 gap-2'}>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setError('') }}
          placeholder="e.g. Acme Law or acme-law"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/15 dark:border-white/15 dark:bg-white/5 dark:text-white"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/15 dark:border-white/15 dark:bg-white/5 dark:text-white"
        >
          <option value="admin">Admin login</option>
          <option value="lawyer">Lawyer login</option>
          <option value="site">Public site</option>
        </select>
        <button
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#14203E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Open
        </button>
      </div>

      {error && <p className={`${isCard ? 'mt-2 text-center' : 'sm:ml-auto'} text-xs text-rose-600 dark:text-rose-300`}>{error}</p>}
    </form>
  )
}
