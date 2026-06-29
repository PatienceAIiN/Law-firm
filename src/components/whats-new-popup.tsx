'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Sparkles, Search, MessageSquare, Video, MapPin, Scale } from 'lucide-react'

const SLIDES = [
  { icon: Search, color: 'from-[#14203E] via-[#1c2c52] to-[#B7913D]', title: 'Find a Barrister', body: 'Search lawyers and law firms across every Indian state, city and locality.', chip: 'NEW' },
  { icon: MapPin, color: 'from-emerald-600 via-emerald-500 to-amber-400', title: 'Auto-detect your city', body: 'Tap once and we snap to the closest metro using your browser GPS. Pick manually anytime.', chip: 'NEW' },
  { icon: MessageSquare, color: 'from-sky-600 via-cyan-500 to-emerald-400', title: 'Live chat with lawyers', body: 'Sign in with Google or email-OTP and message any firm or lawyer in real time.', chip: 'NEW' },
  { icon: Video, color: 'from-fuchsia-600 via-rose-500 to-amber-400', title: 'Instant video consultation', body: 'Request a video call right from a lawyer\'s profile. We mint a private room and email them to join.', chip: 'NEW' },
]

const STORAGE_KEY = 'whats-new:v1'

export function WhatsNewPopup() {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    try { if (!localStorage.getItem(STORAGE_KEY)) setOpen(true) } catch {}
  }, [])
  useEffect(() => {
    if (!open) return
    const t = window.setInterval(() => setIdx((n) => (n + 1) % SLIDES.length), 4500)
    return () => window.clearInterval(t)
  }, [open])

  const close = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()) } catch {}
    setOpen(false)
  }
  if (!open) return null
  const s = SLIDES[idx]
  const Ic = s.icon

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={close}>
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-[#0e1219] animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className={`relative overflow-hidden bg-gradient-to-br ${s.color} transition-colors duration-700`}>
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <Scale className="pointer-events-none absolute right-6 top-6 h-7 w-7 text-white/40" />
          <div className="relative px-5 pb-10 pt-8 text-center text-white sm:px-8 sm:pb-14 sm:pt-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              <Sparkles className="h-3 w-3" /> {s.chip}
            </span>
            <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <Ic className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-5 text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">{s.title}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/85 md:text-base">{s.body}</p>
          </div>
          <button onClick={() => setIdx((n) => (n - 1 + SLIDES.length) % SLIDES.length)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-1.5 text-white hover:bg-white/25">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setIdx((n) => (n + 1) % SLIDES.length)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-1.5 text-white hover:bg-white/25">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-black/20 p-1.5 text-white hover:bg-black/30">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-t border-slate-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#0e1219]">
          <div className="flex items-center justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-primary' : 'w-1.5 bg-slate-300 dark:bg-white/20'}`} />
            ))}
          </div>
          <div className="mt-4 flex flex-col items-stretch justify-center gap-2 sm:flex-row">
            <a href="/find-barrister" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent">
              <Search className="h-4 w-4" /> Find a Barrister
            </a>
            <button onClick={close} className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-[#11151f] dark:text-slate-200 dark:hover:bg-white/10">
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
