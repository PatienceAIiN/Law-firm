'use client'

import { useState } from 'react'
import { Loader2, Check, ChevronDown } from 'lucide-react'

const STATUSES = ['ACTIVE', 'PENDING', 'ADJOURNED', 'DISPOSED', 'CLOSED']

const STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  ADJOURNED: 'bg-orange-100 text-orange-700 border-orange-200',
  DISPOSED: 'bg-blue-100 text-blue-700 border-blue-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function CaseStatusSelect({ caseId, initial }: { caseId: string; initial: string }) {
  const [status, setStatus] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const change = async (next: string) => {
    if (next === status) return
    const prev = status
    setStatus(next); setBusy(true); setError(''); setSaved(false)
    try {
      const r = await fetch(`/api/lawyer/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Update failed')
      setSaved(true); setTimeout(() => setSaved(false), 1800)
    } catch (e: any) {
      setStatus(prev); setError(e?.message || 'Could not update status')
    } finally { setBusy(false) }
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className={`relative inline-flex items-center rounded-lg border px-1 ${STYLES[status] || STYLES.CLOSED}`}>
        <select
          value={status}
          disabled={busy}
          onChange={(e) => change(e.target.value)}
          className="appearance-none bg-transparent py-1.5 pl-2 pr-7 text-sm font-semibold outline-none disabled:opacity-60"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 opacity-70" />
      </div>
      {busy && <Loader2 className="h-4 w-4 animate-spin text-[#14203E]/50" />}
      {saved && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> Saved</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
