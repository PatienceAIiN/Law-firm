'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ReceiptText, Loader2, Send, FileText as FileTextIcon } from 'lucide-react'
import { createReceipt, deleteReceipt, emailReceiptToClient } from './actions'

type R = { id: string; number: string; clientName: string; clientEmail: string; total: number; currency: string; status: string; createdAt: string }

type Item = { description: string; qty: number; rate: number }

export function TenantReceiptsClient({ slug, receipts }: { slug: string; receipts: R[] }) {
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([{ description: 'Legal services', qty: 1, rate: 0 }])
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  const addItem = () => setItems((arr) => [...arr, { description: '', qty: 1, rate: 0 }])
  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i))
  const updateItem = (i: number, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (items.length === 0) { setError('Add at least one line item.'); return }
    const fd = new FormData()
    fd.set('clientName', clientName)
    fd.set('clientEmail', clientEmail)
    fd.set('itemsJson', JSON.stringify(items.map((it) => ({
      description: it.description.trim() || 'Item',
      qty: Number(it.qty) || 0,
      rate: Number(it.rate) || 0,
    }))))
    // Back-compat: server still accepts single description/amount; we send a
    // legacy total when only one row exists so it shows on older renderers.
    if (items.length === 1) {
      fd.set('description', items[0].description.trim() || 'Item')
      fd.set('amount', String((items[0].qty || 0) * (items[0].rate || 0)))
    }
    start(async () => {
      try {
        await createReceipt(slug, fd)
        setOpen(false)
        setItems([{ description: 'Legal services', qty: 1, rate: 0 }])
        setClientName(''); setClientEmail('')
      } catch (err: any) { setError(err.message || 'Failed') }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{receipts.length} receipt{receipts.length === 1 ? '' : 's'}</p>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent">
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
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/api/receipts/${r.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View PDF"
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                      >
                        <FileTextIcon className="h-4 w-4" />
                      </a>
                      <form action={async () => {
                        const next = r.clientEmail || window.prompt('Send receipt PDF to which email?', '')
                        if (!next) return
                        await emailReceiptToClient(slug, r.id, next)
                      }}>
                        <button
                          title={r.clientEmail ? `Re-send to ${r.clientEmail}` : 'Send by email'}
                          className="rounded-md p-1 text-primary hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={async () => { await deleteReceipt(slug, r.id) }}>
                        <button className="rounded-md p-1 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary dark:text-white" /><h3 className="text-lg font-bold text-slate-900 dark:text-white">New receipt</h3></div>
            <form onSubmit={onCreate} className="space-y-3 text-sm">
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="Client name" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" placeholder="Client email (optional — PDF will be emailed if filled)" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />

              <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <div className="mb-2 grid grid-cols-[1fr_70px_100px_36px] gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <span>Description</span><span>Qty</span><span>Rate</span><span />
                </div>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-[1fr_70px_100px_36px] gap-2">
                      <input
                        value={it.description}
                        onChange={(e) => updateItem(i, { description: e.target.value })}
                        placeholder="Item / service"
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-white/5 dark:text-white"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.qty}
                        onChange={(e) => updateItem(i, { qty: Number(e.target.value) })}
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-white/5 dark:text-white"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.rate}
                        onChange={(e) => updateItem(i, { rate: Number(e.target.value) })}
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-white/5 dark:text-white"
                      />
                      <button type="button" onClick={() => removeItem(i)} className="inline-flex items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 disabled:opacity-40" disabled={items.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                  <Plus className="h-3 w-3" /> Add line item
                </button>
                <div className="mt-3 border-t border-slate-200 pt-2 text-right text-sm dark:border-white/10">
                  Total: <span className="font-semibold text-primary dark:text-white">INR {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">Cancel</button>
                <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-accent disabled:opacity-60">
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Create receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
