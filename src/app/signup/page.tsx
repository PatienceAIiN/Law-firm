'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowRight, Mail } from 'lucide-react'
import { requestSignupOtp, verifySignupOtp, type RequestOtpResult, type VerifyOtpResult } from './actions'
import { ThemeToggle } from '@/components/theme-toggle'

type Step = 'form' | 'otp' | 'done'

export default function SignupPage() {
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [devOtp, setDevOtp] = useState<string | undefined>()
  const [requestError, setRequestError] = useState('')
  const [otp, setOtp] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [success, setSuccess] = useState<VerifyOtpResult & { ok: true } | null>(null)

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRequestError('')
    setPending(true)
    try {
      const fd = new FormData(e.currentTarget)
      const r: RequestOtpResult = await requestSignupOtp(fd)
      if (!r.ok) { setRequestError(r.error); return }
      setEmail(r.email)
      setDevOtp(r.devOtp)
      setStep('otp')
    } catch (err: any) {
      setRequestError(err.message || 'An unexpected error occurred')
    } finally {
      setPending(false)
    }
  }

  const submitOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setVerifyError('')
    setPending(true)
    try {
      const code = otp.replace(/\D/g, '')
      const r = await verifySignupOtp(email, code)
      if (!r.ok) { setVerifyError(r.error); return }
      setSuccess(r)
      setStep('done')
    } catch (err: any) {
      setVerifyError(err.message || 'An unexpected error occurred')
    } finally {
      setPending(false)
    }
  }

  const resend = () => {
    setStep('form')
    setVerifyError('')
    setOtp('')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FFFCF8] px-4 py-12 dark:bg-[#0b0f17]">
      <div className="fixed right-4 top-4 z-30"><ThemeToggle /></div>

      <div className="w-full max-w-md rounded-2xl border border-[#F4E8D8] bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#11151f]">
        {step === 'form' && (
          <>
            <h1 className="text-2xl font-bold text-primary dark:text-white">Create your workspace</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              We'll email you a 6-digit code to verify, then send your admin credentials. Your data stays isolated — new workspaces start empty.
            </p>
            <form onSubmit={submitForm} className="mt-6 space-y-4">
              <Field name="name" label="Your name" />
              <Field name="firmName" label="Firm name" />
              <div>
                <span className="block text-sm text-slate-700 dark:text-slate-200">Workspace URL</span>
                <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5">
                  <span className="bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-300">/team/</span>
                  <input
                    name="slug"
                    required
                    placeholder="acme-law"
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none dark:text-white"
                  />
                </div>
              </div>
              <Field name="email" type="email" label="Email" />
              {requestError && <Banner kind="error">{requestError}</Banner>}
              <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pending ? 'Sending OTP…' : 'Send verification code'}
              </button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300"><Mail className="h-4 w-4" /> Verification</div>
            <h1 className="mt-2 text-2xl font-bold text-primary dark:text-white">Enter the code</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              We sent a 6-digit code to <strong>{email}</strong>. Code expires in 10 minutes.
            </p>
            {devOtp && (
              <Banner kind="info">
                Dev mode (Brevo not configured) — your code: <code className="ml-1 rounded bg-white px-2 py-0.5 font-mono text-[13px] tracking-widest dark:bg-white/10">{devOtp}</code>
              </Banner>
            )}
            <form onSubmit={submitOtp} className="mt-6 space-y-4">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                placeholder="123456"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center font-mono text-lg tracking-[0.6em] text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
              {verifyError && <Banner kind="error">{verifyError}</Banner>}
              <button type="submit" disabled={pending || otp.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {pending ? 'Verifying…' : 'Verify & create workspace'}
              </button>
              <button type="button" onClick={resend} className="block w-full text-center text-xs text-slate-500 hover:underline dark:text-slate-400">
                Wrong email? Start over
              </button>
            </form>
          </>
        )}

        {step === 'done' && success && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h1 className="mt-4 text-center text-2xl font-bold text-primary dark:text-white">Workspace activated</h1>
            <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
              We emailed your admin credentials to <strong>{success.email}</strong>.
            </p>
            {success.devPassword && (
              <Banner kind="info">
                Dev mode — admin password: <code className="ml-1 rounded bg-white px-2 py-0.5 font-mono text-[13px] dark:bg-white/10">{success.devPassword}</code>
              </Banner>
            )}
            <div className="mt-6 space-y-2">
              <Link
                href={success.sitePath}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-accent"
              >
                Open your workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={success.loginPath}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/15 px-4 py-3 text-sm font-semibold text-primary hover:bg-[#F4E8D8] dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                Go to admin login
              </Link>
              <Link
                href={`/team/${success.slug}/lawyer/login`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/15 px-4 py-3 text-sm font-semibold text-primary hover:bg-[#F4E8D8] dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                Go to lawyer login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ name, label, type = 'text' }: { name: string; label: string; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
      <input
        name={name}
        type={type}
        required
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
      />
    </label>
  )
}

function Banner({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  const cls = kind === 'error'
    ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200'
    : 'bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200'
  return <div className={`mt-4 rounded-lg px-3 py-2 text-sm ${cls}`}>{children}</div>
}
