'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Download, Send, Pencil, Loader2, FileText, X, Check, AlertTriangle } from 'lucide-react'

type Item = { description: string; qty: number; rate: number }
type Receipt = {
  id: string; number: string; clientName: string; clientEmail: string; createdByName: string
  items: string; currency: string; subtotal: number; taxRate: number; taxAmount: number; total: number
  notes: string | null; status: string; sentAt: string | null; createdAt: string
}

const blankForm = () => ({
  id: '' as string,
  clientName: '', clientEmail: '', currency: 'INR', taxRate: 0, notes: '',
  items: [{ description: '', qty: 1, rate: 0 }] as Item[],
})

export function ReceiptsManager() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blankForm())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showForm, setShowForm] = useState(false)

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2800) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/receipts')
      const data = await res.json()
      if (res.ok) setReceipts(data.receipts || [])
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const subtotal = form.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
  const taxAmount = subtotal * (Number(form.taxRate) || 0) / 100
  const total = subtotal + taxAmount

  const setItem = (i: number, patch: Partial<Item>) =>
    setForm((f) => ({ ...f, items: f.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }))

  const save = async (send: boolean) => {
    setError(''); setBusy(true)
    try {
      const payload = { ...form, send }
      const res = await fetch(form.id ? `/api/receipts/${form.id}` : '/api/receipts', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      // If editing and the user asked to send, fire the send endpoint.
      if (form.id && send) {
        await fetch(`/api/receipts/${form.id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientEmail: form.clientEmail }) })
      }
      flash(send ? `Receipt ${data.receipt?.number || ''} generated & emailed${data.delivery === 'logged' ? ' (dev: logged)' : ''}` : `Receipt saved`)
      setForm(blankForm()); setShowForm(false)
      load()
    } catch (e: any) {
      setError(e?.message || 'Could not save receipt')
    } finally { setBusy(false) }
  }

  const edit = (r: Receipt) => {
    let items: Item[] = []
    try { items = JSON.parse(r.items) } catch {}
    setForm({ id: r.id, clientName: r.clientName, clientEmail: r.clientEmail, currency: r.currency, taxRate: r.taxRate, notes: r.notes || '', items: items.length ? items : [{ description: '', qty: 1, rate: 0 }] })
    setShowForm(true)
    setError('')
  }

  const send = async (r: Receipt) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/receipts/${r.id}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      flash(`Emailed to ${r.clientEmail}${data.delivery === 'logged' ? ' (dev: logged)' : ''}`)
      load()
    } catch (e: any) { setError(e?.message || 'Send failed') } finally { setBusy(false) }
  }

  const remove = async (r: Receipt) => {
    if (!confirm(`Delete receipt ${r.number}?`)) return
    await fetch(`/api/receipts/${r.id}`, { method: 'DELETE' })
    flash('Receipt deleted'); load()
  }

  const sym = (c: string) => (c === 'INR' ? '₹' : c === 'USD' ? '$' : c + ' ')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--primary)] flex items-center gap-2"><FileText className="w-5 h-5 text-[#64748b]" /> Receipts</h2>
        <button onClick={() => { setForm(blankForm()); setShowForm((s) => !s); setError('') }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--accent)]">
          <Plus className="w-4 h-4" /> New Receipt
        </button>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-700"><AlertTriangle className="w-4 h-4" /> {error}</div>}

      {/* Create / edit form */}
      {showForm && (
        <div className="rounded-2xl border border-[#F4E8D8] bg-[#FFFCF8] p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Client name *" className="px-3 py-2.5 rounded-xl border border-[#F4E8D8] bg-white text-sm outline-none" />
            <input value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} placeholder="Client email *" className="px-3 py-2.5 rounded-xl border border-[#F4E8D8] bg-white text-sm outline-none" />
          </div>

          {/* Line items */}
          <div className="space-y-2">
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_90px_30px] gap-2 items-center">
                <input value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Description" className="px-3 py-2 rounded-lg border border-[#F4E8D8] bg-white text-sm outline-none" />
                <input type="number" value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} placeholder="Qty" className="px-2 py-2 rounded-lg border border-[#F4E8D8] bg-white text-sm outline-none" />
                <input type="number" value={it.rate} onChange={(e) => setItem(i, { rate: Number(e.target.value) })} placeholder="Rate" className="px-2 py-2 rounded-lg border border-[#F4E8D8] bg-white text-sm outline-none" />
                <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" disabled={form.items.length === 1}><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setForm((f) => ({ ...f, items: [...f.items, { description: '', qty: 1, rate: 0 }] }))} className="text-xs font-semibold text-[#64748b] inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add item</button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="px-3 py-2.5 rounded-xl border border-[#F4E8D8] bg-white text-sm outline-none">
              <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR</option>
            </select>
            <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} placeholder="Tax %" className="px-3 py-2.5 rounded-xl border border-[#F4E8D8] bg-white text-sm outline-none" />
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="px-3 py-2.5 rounded-xl border border-[#F4E8D8] bg-white text-sm outline-none" />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[#F4E8D8]">
            <div className="text-sm text-[var(--primary)]">
              <span className="text-gray-500">Total: </span><span className="font-black">{sym(form.currency)}{total.toFixed(2)}</span>
              <span className="text-gray-400 text-xs ml-2">(sub {sym(form.currency)}{subtotal.toFixed(2)} + tax {sym(form.currency)}{taxAmount.toFixed(2)})</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => save(false)} disabled={busy} className="px-4 py-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] text-sm font-semibold disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (form.id ? 'Update' : 'Generate & Save')}</button>
              <button onClick={() => save(true)} disabled={busy || !form.clientEmail} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold disabled:opacity-60"><Send className="w-4 h-4" /> {form.id ? 'Update & Send' : 'Generate & Send'}</button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="rounded-2xl border border-[#F4E8D8] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F4E8D8] bg-[#FFFCF8] text-xs font-black uppercase tracking-widest text-[#64748b]">History ({receipts.length})</div>
        {loading ? (
          <div className="p-6 flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : receipts.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No receipts yet.</div>
        ) : (
          <div className="divide-y divide-[#F6F0E8]">
            {receipts.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#FFFCF8]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--primary)]">{r.number}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${r.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{r.clientName} · {r.clientEmail} · {sym(r.currency)}{r.total.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={`/api/receipts/${r.id}/pdf`} title="Download" className="p-2 rounded-lg hover:bg-[#F6F0E8]"><Download className="w-4 h-4 text-[#64748b]" /></a>
                  <button onClick={() => send(r)} disabled={busy} title="Send" className="p-2 rounded-lg hover:bg-[#F6F0E8]"><Send className="w-4 h-4 text-[#64748b]" /></button>
                  <button onClick={() => edit(r)} title="Edit" className="p-2 rounded-lg hover:bg-[#F6F0E8]"><Pencil className="w-4 h-4 text-[#64748b]" /></button>
                  <button onClick={() => remove(r)} title="Delete" className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[130] bg-[var(--primary)] text-white text-sm px-4 py-2 rounded-xl shadow-lg inline-flex items-center gap-2"><Check className="w-4 h-4" /> {toast}</div>}
    </div>
  )
}
