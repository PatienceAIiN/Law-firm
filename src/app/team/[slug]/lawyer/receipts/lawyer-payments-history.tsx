'use client'

// Lawyer-side payment history. Identical UX to the admin component but the
// API endpoint and the visible rows are filtered to advocateId === current
// lawyer. Lawyers cannot refund — only admins can — so the modal hides the
// refund block when invoked from this component.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, Clock, AlertCircle, IndianRupee, Trash2, Loader2 } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'

type Payment = {
  id: string
  amount: number
  currency: string
  status: string
  method: string
  payerName?: string | null
  payerEmail?: string | null
  payerPhone?: string | null
  razorpayPaymentId?: string | null
  razorpayOrderId?: string | null
  refundedAmount?: number
  refundId?: string | null
  paidAt?: string | null
  createdAt: string
  notes?: string | null
  receiptId?: string | null
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'PENDING', label: 'In progress' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'REFUNDED', label: 'Refunded' },
  { id: 'FAILED', label: 'Failed' },
] as const

function statusBadge(s: string) {
  if (s === 'COMPLETED') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
  if (s === 'PENDING' || s === 'IN_PROGRESS') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
  if (s === 'FAILED') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
  if (s === 'REFUNDED' || s === 'PARTIALLY_REFUNDED') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200'
  return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
}

export function LawyerPaymentsHistory({ slug, payments }: { slug: string; payments: Payment[] }) {
  const router = useRouter()
  const [, start] = useTransition()
  const [tab, setTab] = useState<string>('all')
  const [open, setOpen] = useState<Payment | null>(null)
  const filtered = payments.filter((p) => (tab === 'all' ? true : p.status === tab || (tab === 'PENDING' && p.status === 'IN_PROGRESS')))

  return (
    <section className="mt-10">
      <h3 className="text-lg font-bold text-primary dark:text-white">Payment history</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Payments collected on your receipts only. Refunds are handled by the admin.</p>

      <nav className="mt-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === t.id ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white' : 'text-slate-600 hover:text-primary dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No payments here yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {filtered.map((p) => (
              <li
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpen(p)}
                onKeyDown={(e) => { if (e.key === 'Enter') setOpen(p) }}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <IndianRupee className="h-4 w-4 flex-shrink-0 text-primary dark:text-amber-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary dark:text-white">
                      {p.currency} {p.amount.toFixed(2)} <span className="text-xs font-normal text-slate-500">· {p.method}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {p.payerName || p.payerEmail || 'Anonymous'} · {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(p.status)}`}>{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f] animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-primary dark:text-white">Payment details</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{open.method} · {new Date(open.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <Row label="Amount" value={`${open.currency} ${open.amount.toFixed(2)}`} bold />
              <Row label="Status" value={<span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(open.status)}`}>
                {open.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                {(open.status === 'PENDING' || open.status === 'IN_PROGRESS') && <Clock className="h-3 w-3" />}
                {open.status === 'FAILED' && <AlertCircle className="h-3 w-3" />}
                {open.status}
              </span>} />
              {(open.refundedAmount || 0) > 0 && <Row label="Refunded so far" value={`${open.currency} ${(open.refundedAmount || 0).toFixed(2)}`} />}
              {open.payerName && <Row label="Payer" value={open.payerName} />}
              {open.payerEmail && <Row label="Email" value={open.payerEmail} />}
              {open.payerPhone && <Row label="Phone" value={open.payerPhone} />}
              {open.razorpayPaymentId && <Row label="Razorpay payment" value={<code className="font-mono text-[11px]">{open.razorpayPaymentId}</code>} />}
              {open.paidAt && <Row label="Paid at" value={new Date(open.paidAt).toLocaleString()} />}
              {open.notes && <Row label="Notes" value={open.notes} />}
            </div>

            <p className="mt-5 border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
              Need a refund on this payment? Ask your firm's admin — refunds are admin-only by policy.
            </p>
            <div className="mt-3 flex justify-end">
              <button
                onClick={async () => {
                  const ok = await confirmDialog({ title: 'Delete payment?', message: 'This removes the payment record permanently.', confirmLabel: 'Delete', tone: 'danger' })
                  if (!ok) return
                  start(async () => {
                    const { deletePayment } = await import('@/app/team/[slug]/admin/receipts/payment-status-actions')
                    const r = await deletePayment(slug, open!.id, 'lawyer')
                    if (!('ok' in r) || !r.ok) { alert((r as any).error || 'Delete failed'); return }
                    router.refresh()
                    setOpen(null)
                  })
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-900/20 dark:text-rose-200 dark:hover:bg-rose-900/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete payment
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-xs uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`text-right ${bold ? 'font-bold text-primary dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{value}</span>
    </div>
  )
}
