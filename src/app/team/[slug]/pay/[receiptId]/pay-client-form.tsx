'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Upload, ImageIcon } from 'lucide-react'
import { submitClientPayment } from './actions'
import { isValidPhone, phoneHint } from '@/lib/validators'

declare global { interface Window { Razorpay?: any } }

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export function PayClientForm({
  slug, receiptId, amount, currency,
  razorpayEnabled, razorpayKeyId, payerName: defaultName, payerEmail,
}: {
  slug: string; receiptId: string; amount: number; currency: string
  razorpayEnabled?: boolean
  razorpayKeyId?: string
  payerName?: string
  payerEmail?: string
}) {
  const [utr, setUtr] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [proofUrl, setProofUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [rzpLoading, setRzpLoading] = useState(false)

  const payOnline = async () => {
    setError('')
    setRzpLoading(true)
    try {
      const ok = await loadRazorpayScript()
      if (!ok) throw new Error('Could not load Razorpay. Check your network and retry.')
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: slug, receiptId, amount, currency,
          payerName: name || defaultName, payerEmail,
        }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to start payment')
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Pay receipt',
        description: `Receipt for ${currency} ${amount.toFixed(2)}`,
        prefill: { name: name || defaultName || '', email: payerEmail || '', contact: phone || '' },
        handler: async (resp: any) => {
          try {
            const v = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantSlug: slug,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }),
            })
            const vData = await v.json()
            if (!v.ok) throw new Error(vData.error || 'Verification failed')
            setDone(true)
          } catch (e: any) { setError(e?.message || 'Verification failed') }
        },
        modal: { ondismiss: () => setRzpLoading(false) },
        theme: { color: '#14203E' },
      })
      rzp.on('payment.failed', (e: any) => setError(e?.error?.description || 'Payment failed'))
      rzp.open()
    } catch (e: any) {
      setError(e?.message || 'Could not start payment')
    } finally {
      setRzpLoading(false)
    }
  }

  const pickFile = async (file: File) => {
    setError('')
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type.toLowerCase())) {
      setError('PNG or JPEG only'); return
    }
    if (file.size > 5 * 1024 * 1024) { setError('Max 5 MB'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await fetch('/api/pay-proof', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setProofUrl(data.url)
    } catch (e: any) { setError(e?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!utr.trim()) { setError('Enter the UTR / transaction ID from your bank or UPI app'); return }
    if (phone.trim() && !isValidPhone(phone)) { setError('Enter a valid 10-digit Indian mobile number'); return }
    start(async () => {
      const r = await submitClientPayment(slug, receiptId, { utr: utr.trim(), payerName: name.trim(), payerPhone: phone.trim(), proofUrl })
      if (!r.ok) { setError(r.error); return }
      setDone(true)
    })
  }

  if (done) return (
    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-500/30 dark:bg-emerald-900/20">
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
      <p className="mt-3 font-semibold text-emerald-800 dark:text-emerald-100">Payment submitted</p>
      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-200">The firm will verify your transaction and email you a confirmation receipt.</p>
    </div>
  )

  return (
    <>
      {razorpayEnabled && razorpayKeyId && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-900/15">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-200">Pay instantly — auto-confirmed</p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Card / UPI / Netbanking via Razorpay. The firm gets notified the moment the payment succeeds.</p>
          <button
            type="button"
            onClick={payOnline}
            disabled={rzpLoading || pending}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {rzpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {rzpLoading ? 'Opening secure checkout…' : `Pay ${currency} ${amount.toFixed(2)} online`}
          </button>
          <p className="mt-3 text-center text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">or, if you paid manually</p>
        </div>
      )}
    <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#11151f]">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">After you've paid {currency} {amount.toFixed(2)}</p>
      <input value={utr} onChange={(e) => setUtr(e.target.value)} required placeholder="UTR / transaction ID *" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
      <div>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="numeric"
          pattern="[0-9+\-\s()]{10,15}"
          placeholder="Phone (optional)"
          className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#1a2030] dark:text-white ${
            phone && !isValidPhone(phone) ? 'border-rose-400 dark:border-rose-500/60' : 'border-slate-300 dark:border-white/15'
          }`}
        />
        {phone && phoneHint(phone) && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">{phoneHint(phone)}</p>}
      </div>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Payment proof (screenshot)</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
            className="hidden"
            id={`proof-${receiptId}`}
          />
          <label
            htmlFor={`proof-${receiptId}`}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : proofUrl ? <ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? 'Uploading…' : proofUrl ? 'Replace screenshot' : 'Upload PNG / JPEG (≤ 5 MB)'}
          </label>
        </div>
        {proofUrl && (
          <img src={proofUrl} alt="proof" className="mt-2 max-h-40 rounded-md border border-slate-200 object-contain dark:border-white/10" />
        )}
      </label>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">{error}</p>}
      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? 'Submitting…' : 'I have paid — notify the firm'}
      </button>
    </form>
    </>
  )
}
