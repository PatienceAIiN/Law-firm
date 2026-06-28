'use client'

import { useState, useTransition, useEffect } from 'react'
import { markSeen } from '@/hooks/use-unread-counts'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X, Trash2, Send, Download, ReceiptText, Briefcase } from 'lucide-react'
import { createLawyerReceipt, deleteLawyerReceipt } from './actions'
import { DeleteButton } from '@/components/ui/delete-button'

type Item = { description: string; qty: number; rate: number }
type R = { id: string; number: string; clientName: string; clientEmail: string; total: number; currency: string; status: string; createdAt: string }
type Case = { id: string; caseNumber: string; title: string; clientName: string; clientEmail: string | null; clientPhone: string | null; status: string }

export function LawyerReceiptsClient({ slug, cases, receipts }: { slug: string; cases: Case[]; receipts: R[] }) {
  // Mark the receipts (payments) chip as seen the moment the page mounts.
  useEffect(() => { markSeen('payments') }, [])
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([{ description: 'Legal services', qty: 1, rate: 0 }])
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [caseId, setCaseId] = useState<string>('')

  const onPickCase = (id: string) => {
    setCaseId(id)
    const c = cases.find((x) => x.id === id)
    if (c) {
      setClientName(c.clientName)
      if (c.clientEmail) setClientEmail(c.clientEmail)
    }
  }

  const addItem = () => setItems((arr) => [...arr, { description: '', qty: 1, rate: 0 }])
  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i))
  const updateItem = (i: number, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData()
    fd.set('clientName', clientName)
    fd.set('clientEmail', clientEmail)
    fd.set('paymentMethod', paymentMethod)
    if (caseId) fd.set('caseId', caseId)
    fd.set('itemsJson', JSON.stringify(items.map((it) => ({
      description: it.description.trim() || 'Item',
      qty: Number(it.qty) || 0,
      rate: Number(it.rate) || 0,
    }))))
    start(async () => {
      const r = await createLawyerReceipt(slug, fd)
      if (!r.ok) { setError(r.error); return }
      setOpen(false)
      setItems([{ description: 'Legal services', qty: 1, rate: 0 }])
      setClientName(''); setClientEmail(''); setCaseId(''); setPaymentMethod('UPI')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{receipts.length} receipt{receipts.length === 1 ? '' : 's'} (yours)</p>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent">
          <Plus className="h-3.5 w-3.5" /> New receipt
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]">
        {receipts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No receipts yet. Click "New receipt" to issue one.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {receipts.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary dark:text-white">
                    <ReceiptText className="-mt-0.5 mr-1 inline h-3.5 w-3.5" /> {r.number}
                    <span className="ml-2 text-xs font-normal text-slate-500">{r.currency} {r.total.toFixed(2)}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{r.clientName} · {r.clientEmail || 'no email'} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-200">{r.status}</span>
                  <a href={`/api/receipts/${r.id}/pdf`} title="Download PDF" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                    <Download className="h-4 w-4" />
                  </a>
                  <DeleteButton
                    onDelete={() => deleteLawyerReceipt(slug, r.id)}
                    confirmMessage={`Delete receipt ${r.number}? This cannot be undone.`}
                    className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <form
            onSubmit={onCreate}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f] animate-pop-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary dark:text-white">New receipt</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block text-sm">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <Briefcase className="h-3 w-3" /> Link to a case (optional)
              </span>
              <select
                value={caseId}
                onChange={(e) => onPickCase(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
              >
                <option className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white" value="">No case — standalone receipt</option>
                {cases.map((c) => (
                  <option key={c.id} className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white" value={c.id}>
                    {c.caseNumber} — {c.title.slice(0, 48)} ({c.clientName})
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
                Only cases assigned to you appear here. Linking a case pre-fills client info and prints the case number on the PDF.
              </span>
            </label>

            <input value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="Client name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
            <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" placeholder="Client email (optional — PDF will be emailed if filled)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />

            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Payment method</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
              >
                <option className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white" value="UPI">UPI</option>
                <option className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white" value="NEFT">NEFT / Bank transfer</option>
                <option className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white" value="CASH">Cash</option>
                <option className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white" value="OTHER">Other</option>
              </select>
            </label>

            <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <div className="mb-2 grid grid-cols-[1fr_60px_80px_30px] gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:grid-cols-[1fr_70px_100px_36px]">
                <span>Description</span><span>Qty</span><span>Rate</span><span />
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_80px_30px] gap-2 sm:grid-cols-[1fr_70px_100px_36px]">
                    <input value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} placeholder="Item / service" className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
                    <input type="number" min="0" step="0.01" value={it.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
                    <input type="number" min="0" step="0.01" value={it.rate} onChange={(e) => updateItem(i, { rate: Number(e.target.value) })} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
                    <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="rounded-md p-1 text-rose-500 hover:bg-rose-50 disabled:opacity-40">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-primary dark:text-slate-300">
                <Plus className="h-3 w-3" /> Add item
              </button>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-sm dark:border-white/5">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-primary dark:text-white">₹ {total.toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">{error}</p>}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {pending ? 'Creating…' : clientEmail ? 'Create & email PDF' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
