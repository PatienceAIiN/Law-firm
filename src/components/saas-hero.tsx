'use client'

import { useEffect, useState } from 'react'

const SENTENCES = [
  'Marketing site, lawyer portal, video meetings, case files, billing, mail — all in your own private workspace.',
  'Spin up a tenant in 60 seconds. Add lawyers by email invite. Take consultations the same afternoon.',
  'Each workspace is isolated. Your firm\'s clients, cases, and articles never see another tenant\'s data.',
  'Generate receipts as PDFs, email them automatically, and keep a clean ledger by client.',
  'Run secure video consultations from the lawyer portal. The booking link goes to both sides.',
]

const HEADINGS = [
  'One platform. Every part of your practice.',
  'Cases, clients, billing — one workspace.',
  'Your firm. Online. In sixty seconds.',
  'Video consults, receipts, branded site — built in.',
  'LawAI that knows your workspace only.',
]

export function AnimatedHeading({ text }: { text?: string }) {
  const items = text ? [text, ...HEADINGS] : HEADINGS
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % items.length), 7000)
    return () => clearInterval(id)
  }, [items.length])

  return (
    <div className="relative mx-auto mt-6 h-[140px] max-w-5xl md:h-[200px]">
      {items.map((s, idx) => {
        const active = idx === i
        const prev = idx === (i - 1 + items.length) % items.length
        return (
          <h1
            key={idx}
            aria-hidden={!active}
            className={`absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-center text-4xl font-bold leading-tight tracking-tight text-transparent transition-all duration-[1200ms] ease-out md:text-6xl ${
              active
                ? 'translate-y-0 scale-100 opacity-100 blur-0 animate-gradient-x'
                : prev
                  ? '-translate-y-4 scale-95 opacity-0 blur-md'
                  : 'translate-y-6 scale-95 opacity-0 blur-md'
            }`}
          >
            {s.split(' ').map((w, wi) => (
              <span
                key={wi}
                className={active ? 'inline-block' : 'inline-block'}
                style={
                  active
                    ? {
                        animation: 'saas-hero-word 600ms ease-out backwards',
                        animationDelay: `${60 * wi}ms`,
                      }
                    : undefined
                }
              >
                {w}&nbsp;
              </span>
            ))}
          </h1>
        )
      })}
      <style>{`
        @keyframes saas-hero-word {
          0% { opacity: 0; transform: translateY(14px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
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
