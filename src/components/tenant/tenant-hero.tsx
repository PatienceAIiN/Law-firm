'use client'

import { useEffect, useState } from 'react'

const DEFAULT_TAGLINES = [
  'Trusted legal counsel — your dedicated workspace.',
  'Cases, clients, and consultations — handled.',
  'Personal advice. Patient strategy. Real outcomes.',
  'Built for the way our firm actually works.',
  'Book a consultation when it suits you — we\'ll take it from there.',
]

export function TenantHero({
  firmFullName,
  firmName,
  taglines,
}: {
  firmFullName: string
  firmName: string
  taglines?: string[]
}) {
  const lines = (taglines && taglines.length ? taglines : DEFAULT_TAGLINES)
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), 6500)
    return () => clearInterval(id)
  }, [lines.length])

  return (
    <>
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary backdrop-blur">
        {firmName}
      </div>

      {/* Animated firm name — italic Helvetica, gradient sweep */}
      <h1
        className="mt-6 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-balance text-center text-[34px] font-bold italic leading-[1.05] tracking-tight text-transparent animate-gradient-x sm:text-5xl md:text-6xl"
        style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
      >
        {firmFullName.split(' ').map((word, wi) => (
          <span
            key={wi}
            className="inline-block"
            style={{
              animation: 'tenant-hero-word 700ms ease-out backwards',
              animationDelay: `${80 * wi}ms`,
            }}
          >
            {word}&nbsp;
          </span>
        ))}
      </h1>

      {/* Rotating tagline */}
      <div className="relative mx-auto mt-5 h-[88px] max-w-2xl overflow-hidden px-2 sm:h-[64px] md:h-[52px]">
        {lines.map((s, idx) => {
          const active = idx === i
          const prev = idx === (i - 1 + lines.length) % lines.length
          return (
            <p
              key={idx}
              aria-hidden={!active}
              className={`absolute inset-0 text-balance text-base text-slate-700 transition-all duration-700 ease-out dark:text-slate-200 sm:text-lg ${
                active ? 'translate-y-0 opacity-100 blur-0' : prev ? '-translate-y-3 opacity-0 blur-sm' : 'translate-y-3 opacity-0 blur-sm'
              }`}
            >
              {s}
            </p>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes tenant-hero-word {
          0% { opacity: 0; transform: translateY(14px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </>
  )
}
