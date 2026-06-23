'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, Tag, ArrowRight, Sparkles } from 'lucide-react'
import { checkAppSumoCode } from './actions'
import { ThemeToggle } from '@/components/theme-toggle'

export default function RedeemPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState<{ code: string; tier: string } | null>(null)

  const onCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPending(true)
    try {
      const r = await checkAppSumoCode(code)
      if (!r.ok) { setError(r.error); return }
      try { sessionStorage.setItem('appsumo_code', r.code) } catch {}
      setVerified({ code: r.code, tier: r.tier })
    } finally {
      setPending(false)
    }
  }

  const continueToSignup = () => {
    router.push(`/signup?code=${encodeURIComponent(verified!.code)}`)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFFCF8] via-[#FFF8EC] to-[#FFE9B7] px-4 py-12 dark:from-[#0b0f17] dark:via-[#11151f] dark:to-[#1a1208]">
      <div className="fixed right-4 top-4 z-30"><ThemeToggle /></div>

      <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-amber-500/20 dark:bg-[#11151f]/90">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5" /> AppSumo lifetime deal
        </div>
        <h1 className="mt-3 text-3xl font-bold text-primary dark:text-white">Redeem your code</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Enter the code from your AppSumo email. We'll verify it, then take you straight to workspace creation.
        </p>

        {!verified ? (
          <form onSubmit={onCheck} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <Tag className="h-3.5 w-3.5" /> Redemption code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                autoFocus
                placeholder="PATIENCE-XXXX-XXXX"
                className="mt-1 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-mono text-base uppercase tracking-[0.2em] text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-amber-300/40 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-white"
              />
            </label>
            {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">{error}</div>}
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {pending ? 'Verifying…' : 'Verify code'}
            </button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Already created your workspace? <Link href="/" className="underline">Open it from the home page</Link>.
            </p>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Code verified
              </div>
              <div className="mt-1 font-mono text-xs">{verified.code} · {verified.tier}</div>
              <p className="mt-2 text-xs">One-time use. Continue to claim your workspace and admin login.</p>
            </div>
            <button
              onClick={continueToSignup}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-accent"
            >
              Continue to workspace creation <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <ul className="mt-8 space-y-2 border-t border-amber-100 pt-6 text-xs text-slate-600 dark:border-white/10 dark:text-slate-400">
          <li>✓ Lifetime access — pay once, use forever</li>
          <li>✓ Unlimited cases, lawyers, clients</li>
          <li>✓ Built-in LawAI assistant, video consultations, receipts</li>
          <li>✓ Custom branding + your own subdomain workspace</li>
        </ul>
      </div>
    </div>
  )
}
