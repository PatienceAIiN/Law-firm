'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

// Icon-only back button. Uses router.back() when there's history,
// otherwise falls back to the optional `fallback` href.
export function BackButton({
  fallback = '/',
  className = '',
  label = 'Go back',
}: {
  fallback?: string
  className?: string
  label?: string
}) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back()
        else router.push(fallback)
      }}
      aria-label={label}
      title={label}
      className={
        className ||
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-primary active:scale-95 dark:border-white/15 dark:bg-[#11151f] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
      }
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  )
}
