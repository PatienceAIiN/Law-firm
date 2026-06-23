'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ReceiptText, Loader2 } from 'lucide-react'
import { createReceipt, deleteReceipt } from './actions'

type R = { id: string; number: string; clientName: string; clientEmail: string; total: number; currency: string; status: string; createdAt: string }

export function TenantReceiptsClient({ slug, receipts }: { slug: string; receipts: R[] }) {
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    start(async () => {
      try { await createReceipt(slug, fd); setOpen(false) }
      catch (err: any) { setError(err.message || 'Failed') }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{receipts.length} receipt{receipts.length === 1 ? '' : 's'}</p>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#14203E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1d2c52]">
          <Plus className="h-3.5 w-3.5" /> New receipt
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {receipts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No receipts yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr>
                <th className="px-3 py-2 text-left">Number</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-mono text-xs">{r.number}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                    {r.clientName}
                    <div className="text-xs text-slate-500">{r.clientEmail}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">{r.currency} {r.total.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-200">{r.status}</span></td>
                  <td className="px-3 py-2 text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={async () => { await deleteReceipt(slug, r.id) }}>
                      <button className="rounded-md p-1 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2"><ReceiptText className="h-5 w-5 text-[#14203E] dark:text-white" /><h3 className="text-lg font-bold text-slate-900 dark:text-white">New receipt</h3></div>
            <form onSubmit={onCreate} className="space-y-3 text-sm">
              <input name="clientName" required placeholder="Client name" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="clientEmail" type="email" required placeholder="Client email" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="description" placeholder="Description (e.g. Consultation fee)" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="amount" required type="number" step="0.01" min="0" placeholder="Amount (INR)" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">Cancel</button>
                <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-[#14203E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
