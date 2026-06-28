'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, RotateCcw, CheckCircle2, Clock, AlertCircle, IndianRupee, Paperclip, Download, Maximize2, Trash2 } from 'lucide-react'
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
  utr?: string | null
  proofUrl?: string | null
  approvedByName?: string | null
  approvedByRole?: string | null
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'AWAITING_REVIEW', label: 'Awaiting review' },
  { id: 'PENDING', label: 'In progress' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'REFUNDED', label: 'Refunded' },
  { id: 'FAILED', label: 'Failed' },
] as const

function statusBadge(s: string) {
  if (s === 'RECEIVED') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
  if (s === 'RECONCILIATION') return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200'
  if (s === 'COMPLETED') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
  if (s === 'PENDING' || s === 'IN_PROGRESS') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
  if (s === 'FAILED') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
  if (s === 'REFUNDED' || s === 'PARTIALLY_REFUNDED') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200'
  return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
}

export function PaymentsHistory({ slug, payments }: { slug: string; payments: Payment[] }) {
  const [tab, setTab] = useState<string>('all')
  const [rows, setRows] = useState<Payment[]>(payments)
  const [open, setOpen] = useState<Payment | null>(null)
  useEffect(() => {
    setRows(payments)
  }, [payments])

  const deletePayment = async (payment: Payment) => {
    if (!window.confirm('Delete this completed payment record?')) return
    const res = await fetch(`/api/payments/${payment.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { window.alert(data.error || 'Delete failed'); return }
    setRows((current) => current.filter((p) => p.id !== payment.id))
    setOpen((current) => current?.id === payment.id ? null : current)
  }

  const replacePayment = (payment: Payment) => {
    setRows((current) => current.map((p) => (p.id === payment.id ? { ...p, ...payment } : p)))
    setOpen((current) => (current?.id === payment.id ? { ...current, ...payment } : current))
  }
  const filtered = rows.filter((p) => (tab === 'all' ? true : p.status === tab || (tab === 'PENDING' && p.status === 'IN_PROGRESS')))
  const updateRowStatus = async (payment: Payment, status: string) => {
    const res = await fetch(`/api/payments/${payment.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setOpen(payment); return }
    if (data.payment) replacePayment(data.payment)
  }


  return (
    <section className="mt-10">
      <h3 className="text-lg font-bold text-primary dark:text-white">Payment history</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Collections for this workspace. Use the status selector on each row, or click a row to view proof/refund details.</p>

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
                      {p.currency} {p.amount.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-500">· {p.method}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {p.payerName || p.payerEmail || 'Anonymous'} · {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(p.status)}`}>{p.status}</span>
                  <select
                    value=""
                    aria-label={`Change payment status for ${p.payerName || p.id}`}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation()
                      const next = e.target.value
                      e.currentTarget.value = ''
                      if (next) updateRowStatus(p, next)
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
                  >
                    <option value="">Status…</option>
                    <option value="RECEIVED">Received</option>
                    <option value="PENDING">Pending</option>
                    <option value="RECONCILIATION">Reconciliation</option>
                    <option value="COMPLETED">Completed / verified</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && <PaymentModal slug={slug} payment={open} onClose={() => setOpen(null)} onPaymentChange={replacePayment} onDelete={deletePayment} />}
    </section>
  )
}

function PaymentModal({ slug, payment, onClose }: { slug: string; payment: Payment; onClose: () => void }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [refundAmount, setRefundAmount] = useState<string>('')
  const [statusChoice, setStatusChoice] = useState(payment.status)
  const [lightbox, setLightbox] = useState(false)
  const router = useRouter()

  const onDelete = async () => {
    const ok = await confirmDialog({
      title: 'Delete payment?',
      message: `This removes the payment record permanently. Refund / approval history is lost.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return
    start(async () => {
      const { deletePayment } = await import('./payment-status-actions')
      const r = await deletePayment(slug, payment.id, 'admin')
      if (!('ok' in r) || !r.ok) { setError((r as any).error || 'Delete failed'); return }
      router.refresh()
      onClose()
    })
  }

  const saveStatus = (override?: string) => {
    const next = override || statusChoice
    if (next === payment.status) return
    setError('')
    start(async () => {
      const { setPaymentStatus } = await import('./payment-status-actions')
      const r = await setPaymentStatus(slug, payment.id, next, 'admin')
      if (!('ok' in r) || !r.ok) { setError((r as any).error || 'Failed'); return }
      router.refresh()
      onClose()
    })
  }

  const refundable = payment.amount - (payment.refundedAmount || 0)
  const canRefund = (payment.status === 'COMPLETED' || payment.status === 'PARTIALLY_REFUNDED') && refundable > 0

  const refund = async (full: boolean) => {
    setError('')
    const amt = full ? undefined : Number(refundAmount)
    if (!full && (!amt || amt <= 0 || amt > refundable)) { setError(`Enter 0.01–${refundable.toFixed(2)}`); return }
    const { confirmDialog } = await import('@/components/ui/confirm-dialog')
    const ok = await confirmDialog({
      title: full ? 'Refund full amount?' : 'Refund partial amount?',
      message: full ? `Refund ${payment.currency} ${refundable.toFixed(2)}? This cannot be undone.` : `Refund ${payment.currency} ${amt!.toFixed(2)}?`,
      confirmLabel: 'Refund',
    })
    if (!ok) return
    start(async () => {
      try {
        const res = await fetch(`/api/payments/${payment.id}/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amt }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Refund failed')
        onPaymentChange(data.payment)
        onClose()
      } catch (e: any) { setError(e?.message || 'Refund failed') }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f] animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-primary dark:text-white">Payment details</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{payment.method} · {new Date(payment.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <Row label="Amount" value={`${payment.currency} ${payment.amount.toFixed(2)}`} bold />
          <Row label="Status" value={<span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(payment.status)}`}>
            {payment.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
            {(payment.status === 'PENDING' || payment.status === 'IN_PROGRESS') && <Clock className="h-3 w-3" />}
            {payment.status === 'FAILED' && <AlertCircle className="h-3 w-3" />}
            {payment.status}
          </span>} />
          {(payment.refundedAmount || 0) > 0 && (
            <Row label="Refunded so far" value={`${payment.currency} ${(payment.refundedAmount || 0).toFixed(2)}`} />
          )}
          {payment.payerName && <Row label="Payer" value={payment.payerName} />}
          {payment.payerEmail && <Row label="Email" value={payment.payerEmail} />}
          {payment.payerPhone && <Row label="Phone" value={payment.payerPhone} />}
          {payment.razorpayPaymentId && <Row label="Razorpay payment" value={<code className="font-mono text-[11px]">{payment.razorpayPaymentId}</code>} />}
          {payment.razorpayOrderId && <Row label="Razorpay order" value={<code className="font-mono text-[11px]">{payment.razorpayOrderId}</code>} />}
          {payment.refundId && <Row label="Refund id" value={<code className="font-mono text-[11px]">{payment.refundId}</code>} />}
          {payment.paidAt && <Row label="Paid at" value={new Date(payment.paidAt).toLocaleString()} />}
          {payment.utr && <Row label="UTR" value={<code className="font-mono text-[11px]">{payment.utr}</code>} />}
          {payment.approvedByName && <Row label="Approved by" value={`${payment.approvedByName}${payment.approvedByRole ? ` (${payment.approvedByRole})` : ''}`} />}
          {payment.notes && <Row label="Notes" value={payment.notes} />}
          {payment.proofUrl ? (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary hover:bg-white hover:text-primary dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Paperclip className="h-3.5 w-3.5" /> View attached proof
            </button>
          ) : null}
          {/* Approve button — visible for client-submitted payments
              (AWAITING_REVIEW) AND legacy fallback rows that landed as
              PENDING with a UTR / proof note attached. */}
          {(payment.status === 'AWAITING_REVIEW' ||
            (payment.status === 'PENDING' && /UTR|Proof/i.test(payment.notes || ''))) && (
            <button
              onClick={() => saveStatus('COMPLETED')}
              disabled={pending}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Approve &amp; mark as paid
            </button>
          )}
        </div>

        {/* Manual status marker — admin can override (e.g. mark a UTR-
            submitted payment COMPLETED after verifying the bank credit). */}
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Update status manually</p>
          <div className="mt-2 flex items-center gap-2">
            <select
              value={statusChoice}
              onChange={(e) => setStatusChoice(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
            >
              {['PENDING','AWAITING_REVIEW','IN_PROGRESS','COMPLETED','FAILED','REFUNDED'].map((s) => (
                <option key={s} value={s} className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white">{s}</option>
              ))}
            </select>
            <button
              onClick={() => saveStatus()}
              disabled={pending || statusChoice === payment.status}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-accent disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Marking COMPLETED auto-emails the client a paid copy of the receipt.</p>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={onDelete}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-900/20 dark:text-rose-200 dark:hover:bg-rose-900/30"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete payment
          </button>
        </div>


        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Manual status</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['RECEIVED', 'PENDING', 'RECONCILIATION'].map((status) => (
              <button key={status} disabled={pending} onClick={() => updateStatus(status)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">{status}</button>
            ))}
            <select disabled={pending} onChange={(e) => { if (e.target.value) updateStatus(e.target.value); e.currentTarget.value = '' }} defaultValue="" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-white/15 dark:bg-[#1a2030] dark:text-white">
              <option value="">More…</option><option value="COMPLETED">Completed / verified</option><option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {payment.status === 'COMPLETED' && (
          <button type="button" disabled={pending} onClick={() => onDelete(payment)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
            <Trash2 className="h-3.5 w-3.5" /> Delete after verification
          </button>
        )}

        {canRefund && (
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Refund</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={refundable.toFixed(2)}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={`Partial up to ${refundable.toFixed(2)}`}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
              />
              <button
                onClick={() => refund(false)}
                disabled={pending || !refundAmount}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Partial
              </button>
              <button
                onClick={() => refund(true)}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Refund all
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Refund is initiated via Razorpay. Settlement to the client's account typically takes 5–7 working days.</p>
          </div>
        )}
      </div>

      {/* Proof lightbox — separate modal layer so it stacks above the
          payment-details modal and the backdrop click only dismisses the
          lightbox, not the whole modal. */}
      {lightbox && payment.proofUrl && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="absolute right-0 top-0 flex translate-y-[-110%] items-center gap-2">
              <a
                href={payment.proofUrl}
                download={`payment-proof-${payment.id}.png`}
                className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow hover:bg-white"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
              <a
                href={payment.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow hover:bg-white"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Enlarge
              </a>
              <button
                onClick={() => setLightbox(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={payment.proofUrl}
              alt="Payment proof"
              className="mx-auto max-h-[90vh] w-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
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
