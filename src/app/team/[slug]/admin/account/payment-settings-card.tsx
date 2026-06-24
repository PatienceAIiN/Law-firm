'use client'

import { useState, useTransition } from 'react'
import { Loader2, Check, IndianRupee } from 'lucide-react'
import { savePaymentSettings } from './payment-actions'

type Cfg = {
  razorpayKeyId?: string
  razorpayKeySecret?: string
  upiVpa?: string
  upiName?: string
  bankAccountHolder?: string
  bankAccountNumber?: string
  bankIfsc?: string
  bankName?: string
  enabled?: boolean
}

export function PaymentSettingsCard({ slug, initial }: { slug: string; initial: Cfg }) {
  const [cfg, setCfg] = useState<Cfg>(initial || {})
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof Cfg, v: any) => setCfg((c) => ({ ...c, [k]: v }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    start(async () => {
      const r = await savePaymentSettings(slug, cfg)
      if (!r.ok) { setError(r.error || 'Failed'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <form onSubmit={save} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#11151f]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-primary dark:text-white">
            <IndianRupee className="h-4 w-4" /> Payments
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Your workspace's payment credentials. Money from your receipts is collected into <strong>your</strong> bank account — never into another firm's.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={!!cfg.enabled}
            onChange={(e) => set('enabled', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-primary"
          />
          Accept online payments
        </label>
      </div>

      <fieldset className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-white/5">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-slate-500">UPI</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="UPI ID (VPA)" placeholder="harshlaw@oksbi" value={cfg.upiVpa} onChange={(v) => set('upiVpa', v)} />
          <Input label="Payee name" placeholder="Harsh &amp; Co" value={cfg.upiName} onChange={(v) => set('upiName', v)} />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          When the receipt's payment method is UPI, a scannable QR for this VPA is added to the PDF.
        </p>
      </fieldset>

      <fieldset className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-white/5">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Bank account</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Account holder" value={cfg.bankAccountHolder} onChange={(v) => set('bankAccountHolder', v)} />
          <Input label="Bank name" value={cfg.bankName} onChange={(v) => set('bankName', v)} />
          <Input label="Account number" value={cfg.bankAccountNumber} onChange={(v) => set('bankAccountNumber', v)} />
          <Input label="IFSC" value={cfg.bankIfsc} onChange={(v) => set('bankIfsc', v?.toUpperCase())} />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Shown on the receipt PDF for NEFT/RTGS clients.</p>
      </fieldset>

      <fieldset className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-white/5">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Razorpay (optional but recommended)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Razorpay Key ID" placeholder="rzp_live_..." value={cfg.razorpayKeyId} onChange={(v) => set('razorpayKeyId', v?.trim())} />
          <Input label="Razorpay Key Secret" placeholder="••••••••••••" value={cfg.razorpayKeySecret} onChange={(v) => set('razorpayKeySecret', v?.trim())} type="password" />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Create these from your Razorpay dashboard → Account & Settings → API Keys. Money settles to <strong>your</strong> linked bank — we never touch it.
        </p>
      </fieldset>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">{error}</p>}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Stored encrypted at rest in your workspace settings.</span>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
          {pending ? 'Saving…' : saved ? 'Saved' : 'Save payment settings'}
        </button>
      </div>
    </form>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
      />
    </label>
  )
}
