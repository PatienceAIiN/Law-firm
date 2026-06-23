'use client'

import { useEffect, useState } from 'react'

const SENTENCES = [
  'Marketing site, lawyer portal, video meetings, case files, billing, mail — all in your own private workspace.',
  'Spin up a tenant in 60 seconds. Add lawyers by email invite. Take consultations the same afternoon.',
  'Each workspace is isolated. Your firm\'s clients, cases, and articles never see another tenant\'s data.',
  'Generate receipts as PDFs, email them automatically, and keep a clean ledger by client.',
  'Run secure video consultations from the lawyer portal. The booking link goes to both sides.',
]

export function AnimatedHeading({ text }: { text: string }) {
  // Animate the heading word-by-word once on mount.
  const words = text.split(' ')
  return (
    <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
      {words.map((w, i) => (
        <span
          key={i}
          className="inline-block opacity-0 [animation-fill-mode:forwards]"
          style={{ animation: `saas-hero-word 600ms ease-out forwards`, animationDelay: `${80 * i}ms` }}
        >
          {w}&nbsp;
        </span>
      ))}
      <style>{`
        @keyframes saas-hero-word {
          0% { opacity: 0; transform: translateY(14px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </h1>
  )
}

export function RotatingTagline() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % SENTENCES.length), 4200)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="relative mx-auto mt-5 h-[72px] max-w-2xl overflow-hidden md:h-[56px]">
      {SENTENCES.map((s, idx) => (
        <p
          key={idx}
          aria-hidden={idx !== i}
          className={`absolute inset-0 text-lg text-slate-700 transition-all duration-700 ease-out dark:text-slate-200 ${
            idx === i
              ? 'translate-y-0 opacity-100'
              : idx === (i - 1 + SENTENCES.length) % SENTENCES.length
                ? '-translate-y-3 opacity-0'
                : 'translate-y-3 opacity-0'
          }`}
        >
          {s}
        </p>
      ))}
    </div>
  )
}
