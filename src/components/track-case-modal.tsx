'use client'

import { useState } from 'react'
import { Search, X, Loader2, ShieldCheck, FileDown, ArrowLeft, Scale, CalendarClock, Gavel, User } from 'lucide-react'

type CaseResult = {
  caseNumber: string; title: string; caseType: string; status: string; court: string
  filingDate: string | null; nextHearingDate: string | null
  advocate: { name: string; title: string } | null
  notes: { content: string; date: string | null }[]
  totalPaid: number
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700', PENDING: 'bg-amber-100 text-amber-700',
  ADJOURNED: 'bg-orange-100 text-orange-700', DISPOSED: 'bg-blue-100 text-blue-700', CLOSED: 'bg-gray-100 text-gray-600',
}

export function TrackCaseButton({ className = '', label = 'Track Case' }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'form' | 'otp' | 'result'>('form')
  const [form, setForm] = useState({ name: '', caseNumber: '', phone: '' })
  const [otp, setOtp] = useState('')
  const [requestId, setRequestId] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [result, setResult] = useState<CaseResult | null>(null)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const reset = () => { setStep('form'); setForm({ name: '', caseNumber: '', phone: '' }); setOtp(''); setRequestId(''); setResult(null); setToken(''); setError(''); setInfo('') }
  const closeAll = () => { setOpen(false); setTimeout(reset, 200) }

  const requestOtp = async () => {
    setBusy(true); setError(''); setInfo('')
    try {
      const r = await fetch('/api/track-case/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Request failed')
      if (!d.sent) { setInfo(d.message || 'If the details match, an OTP has been sent.'); return }
      setRequestId(d.requestId); setMaskedEmail(d.maskedEmail); setStep('otp')
    } catch (e: any) { setError(e?.message || 'Could not send code') } finally { setBusy(false) }
  }

  const verify = async () => {
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/track-case/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, otp }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Verification failed')
      setResult(d.case); setToken(d.accessToken); setStep('result')
    } catch (e: any) { setError(e?.message || 'Could not verify') } finally { setBusy(false) }
  }

  const field = 'w-full rounded-xl border border-[#F4E8D8] bg-white px-3.5 py-3 text-sm text-[var(--primary)] outline-none focus:border-[var(--primary)]'

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>{label}</button>

      {open && (
        <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" onClick={closeAll}>
          <div className="mt-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-[#F4E8D8]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F4E8D8] px-5 py-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--primary)]"><Search className="h-5 w-5" /> Track Your Case</h3>
              <button onClick={closeAll} className="rounded-lg p-1.5 text-[var(--primary)]/60 hover:bg-[#F6F0E8]"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5">
              {/* STEP 1 — identify */}
              {step === 'form' && (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--primary)]/60">Enter your case number to receive a one-time code on the registered email. Name &amp; phone are optional for extra verification.</p>
                  <input className={field} placeholder="Case number *" value={form.caseNumber} onChange={(e) => setForm({ ...form, caseNumber: e.target.value })} />
                  <input className={field} placeholder="Full name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className={field} placeholder="Registered phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {info && <p className="rounded-lg bg-[#F6F0E8] px-3 py-2 text-sm text-[var(--primary)]">{info}</p>}
                  <button onClick={requestOtp} disabled={busy || !form.caseNumber.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Send Verification Code
                  </button>
                </div>
              )}

              {/* STEP 2 — OTP */}
              {step === 'otp' && (
                <div className="space-y-3">
                  <button onClick={() => { setStep('form'); setError('') }} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]/60 hover:text-[var(--primary)]"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                  <p className="text-sm text-[var(--primary)]/70">We sent a 6-digit code to <span className="font-semibold">{maskedEmail}</span>. Enter it below.</p>
                  <input className={`${field} text-center text-2xl font-bold tracking-[8px]`} placeholder="000000" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <button onClick={verify} disabled={busy || otp.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify & View Case
                  </button>
                </div>
              )}

              {/* STEP 3 — result */}
              {step === 'result' && result && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-[var(--primary)]">{result.caseNumber}</div>
                      <div className="text-sm text-[var(--primary)]/70">{result.title}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLOR[result.status] || STATUS_COLOR.CLOSED}`}>{result.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info icon={Scale} label="Type" value={result.caseType} />
                    <Info icon={Gavel} label="Court" value={result.court} />
                    <Info icon={CalendarClock} label="Next Hearing" value={result.nextHearingDate || 'Not scheduled'} />
                    <Info icon={User} label="Advocate" value={result.advocate ? `${result.advocate.name}` : 'To be assigned'} />
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--primary)]/50">Case Notes</div>
                    {result.notes.length === 0 ? (
                      <p className="text-sm text-[var(--primary)]/50">No public notes yet.</p>
                    ) : (
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {result.notes.map((n, i) => (
                          <div key={i} className="rounded-lg border border-[#F4E8D8] bg-[#FFFCF8] p-3">
                            <p className="text-sm text-[var(--primary)]">{n.content}</p>
                            <p className="mt-1 text-[11px] text-[var(--primary)]/40">{n.date}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <a href={`/api/track-case/pdf?token=${token}`} target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary)] py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[#F6F0E8]">
                    <FileDown className="h-4 w-4" /> Print / Download PDF
                  </a>
                  <p className="text-center text-[11px] text-[var(--primary)]/40">This information is confidential and shown only after email verification.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#F4E8D8] bg-[#FFFCF8] p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--primary)]/50"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--primary)]">{value}</div>
    </div>
  )
}
