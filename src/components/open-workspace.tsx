'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Loader2, X, Mail, CheckCircle2 } from 'lucide-react'

type Step = 'email' | 'otp' | 'pick'

export function OpenWorkspace({ variant = 'inline' }: { variant?: 'inline' | 'card' }) {
  const [open, setOpen] = useState(false)

  const buttonClass =
    variant === 'card'
      ? 'mx-auto mt-10 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-accent'
      : 'inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonClass}>
        Open your workspace <ArrowRight className="h-4 w-4" />
      </button>
      {open && <OpenWorkspaceModal onClose={() => setOpen(false)} />}
    </>
  )
}

function OpenWorkspaceModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [devOtp, setDevOtp] = useState<string | undefined>()
  const [workspaces, setWorkspaces] = useState<{ slug: string; name: string }[]>([])
  const [remember, setRemember] = useState(true)

  // Auto-login: if previously remembered, try to skip OTP entirely
  useEffect(() => {
    const remembered = localStorage.getItem('workspace-remember-email')
    if (!remembered) return
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/workspace-open/auto', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: remembered }),
        })
        const data = await res.json()
        if (active && data.ok && data.slug) {
          window.location.href = `/t/${data.slug}/admin`
        }
      } catch {}
    })()
    return () => { active = false }
  }, [])

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const res = await fetch('/api/workspace-open/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send code')
      setDevOtp(data.devOtp)
      setStep('otp')
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  const verifyOtp = async (slugOverride?: string) => {
    setError(''); setBusy(true)
    try {
      const res = await fetch('/api/workspace-open/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code, slug: slugOverride, remember }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      if (data.requiresPick) {
        setWorkspaces(data.workspaces)
        setStep('pick')
        return
      }
      // Cookie is set on the server; navigate hard to the admin so the new
      // session is picked up on first paint.
      if (remember) {
        localStorage.setItem('workspace-remember-email', email)
      } else {
        localStorage.removeItem('workspace-remember-email')
      }
      window.location.href = `/t/${data.slug}/admin`
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault()
    verifyOtp()
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[#F4E8D8] bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#11151f]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/70 dark:text-white/70">
            <Mail className="h-4 w-4" /> Open your workspace
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'email' && (
          <form onSubmit={requestOtp} className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Enter the admin email you signed up with. We'll send you a 6-digit code.</p>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            {error && <Banner kind="error">{error}</Banner>}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                  remember
                    ? 'border-primary bg-primary'
                    : 'border-slate-300 bg-white dark:border-white/30 dark:bg-white/5'
                } group-hover:border-primary`}
                onClick={() => setRemember(!remember)}
              >
                {remember && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="sr-only" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Remember me — skip OTP next time</span>
            </label>
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={submitOtp} className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Code sent to <strong>{email}</strong>. Expires in 10 minutes.
            </p>
            {devOtp && (
              <Banner kind="info">
                Dev mode — code: <code className="ml-1 rounded bg-white px-2 py-0.5 font-mono text-[13px] tracking-widest dark:bg-white/10">{devOtp}</code>
              </Banner>
            )}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center font-mono text-lg tracking-[0.6em] text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            {error && <Banner kind="error">{error}</Banner>}
            <button disabled={busy || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {busy ? 'Verifying…' : 'Verify & open'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setCode(''); setError('') }} className="block w-full text-center text-xs text-slate-500 hover:underline dark:text-slate-400">
              Wrong email? Start over
            </button>
          </form>
        )}

        {step === 'pick' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">You own multiple workspaces. Pick one to open:</p>
            {error && <Banner kind="error">{error}</Banner>}
            <ul className="space-y-2">
              {workspaces.map((w) => (
                <li key={w.slug}>
                  <button
                    onClick={() => verifyOtp(w.slug)}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <span>
                      <p className="text-sm font-semibold text-primary dark:text-white">{w.name}</p>
                      <p className="text-xs text-slate-500">/t/{w.slug}</p>
                    </span>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 text-slate-400" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Banner({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  const cls = kind === 'error'
    ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200'
    : 'bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200'
  return <div className={`rounded-lg px-3 py-2 text-xs ${cls}`}>{children}</div>
}
