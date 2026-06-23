import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { RedeemClient } from './redeem-client'

export const metadata = { title: 'Redeem AppSumo code' }

export default function RedeemPage() {
  const required = process.env.APPSUMO_REQUIRED === 'true'

  if (required) return <RedeemClient />

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFFCF8] via-[#FFF8EC] to-[#FFE9B7] px-4 py-12 dark:from-[#0b0f17] dark:via-[#11151f] dark:to-[#1a1208]">
      <div className="fixed right-4 top-4 z-30"><ThemeToggle /></div>
      <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white/90 p-8 text-center shadow-2xl backdrop-blur dark:border-amber-500/20 dark:bg-[#11151f]/90">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" /> Free during launch
        </div>
        <h1 className="mt-4 text-3xl font-bold text-primary dark:text-white">No code needed right now</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          PatienceAI is fully free to use while we prepare our AppSumo launch.
          Skip the code and create your workspace straight away.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-accent"
        >
          Create your workspace <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Once we go live on AppSumo, this page will accept your redemption code.
        </p>
      </div>
    </div>
  )
}
