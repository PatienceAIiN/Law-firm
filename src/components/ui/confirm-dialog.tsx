'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
}

type PendingConfirm = ConfirmOptions & { resolve: (v: boolean) => void }

// Event-bus singleton so any component can call `confirmDialog(...)`
// without prop-drilling. The host <ConfirmHost /> mounts once in the
// root layout and renders the modal on demand.
const listeners = new Set<(p: PendingConfirm) => void>()

export function confirmDialog(opts: string | ConfirmOptions): Promise<boolean> {
  const normalized: ConfirmOptions = typeof opts === 'string' ? { message: opts } : opts
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (listeners.size === 0) {
      // No host mounted — fall back so behavior is still correct.
      return resolve(window.confirm(normalized.message))
    }
    listeners.forEach((fn) => fn({ ...normalized, resolve }))
  })
}

export function ConfirmHost() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onRequest = (p: PendingConfirm) => setPending(p)
    listeners.add(onRequest)
    return () => { listeners.delete(onRequest) }
  }, [])

  useEffect(() => {
    if (!pending) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') reply(false)
      else if (e.key === 'Enter') reply(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  const reply = (v: boolean) => {
    pending?.resolve(v)
    setPending(null)
  }

  if (!pending) return null
  const tone = pending.tone || 'danger'
  const confirmCls = tone === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-400/40'
    : 'bg-primary hover:bg-accent focus:ring-amber-400/40'

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={() => reply(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#11151f] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${tone === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-primary dark:text-white">{pending.title || 'Are you sure?'}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{pending.message}</p>
          </div>
          <button onClick={() => reply(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={() => reply(false)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {pending.cancelLabel || 'Cancel'}
          </button>
          <button
            onClick={() => reply(true)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 ${confirmCls}`}
            autoFocus
          >
            {pending.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
