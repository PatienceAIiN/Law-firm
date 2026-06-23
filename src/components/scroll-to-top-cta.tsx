'use client'

import { ArrowUp } from 'lucide-react'
import { useCallback } from 'react'

export function ScrollToTopCta() {
  const onClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const target = document.getElementById('top-create-workspace')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Pulse the button so users see exactly where to click next.
      target.classList.add('ring-4', 'ring-amber-300/70', 'ring-offset-2', 'transition')
      window.setTimeout(() => {
        target.classList.remove('ring-4', 'ring-amber-300/70', 'ring-offset-2')
      }, 2200)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  return (
    <button
      onClick={onClick}
      aria-label="Scroll up to Create your workspace"
      className="group relative mt-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary via-[#1c2c52] to-accent text-white shadow-2xl shadow-[#14203E]/30 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-amber-300/50"
    >
      {/* outward ping pulse */}
      <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-amber-400/40" />
      <span className="pointer-events-none absolute inset-1 rounded-full bg-gradient-to-br from-primary to-accent" />
      <ArrowUp
        className="relative z-10 h-9 w-9 animate-bounce drop-shadow"
        strokeWidth={2.5}
      />
      <span className="pointer-events-none absolute -bottom-8 whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
        Create above ↑
      </span>
    </button>
  )
}
