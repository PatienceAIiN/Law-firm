'use client'

import { useEffect, useState } from 'react'
import { Search, MessageSquare, Video, MapPin, Sparkles, Scale, X, ArrowRight, Building2 } from 'lucide-react'

const FEATURES = [
  { icon: Search, label: 'Search lawyers and firms across India by state, city, locality, PIN.' },
  { icon: MapPin, label: 'Auto-detect your city via GPS — manual override anytime.' },
  { icon: MessageSquare, label: 'Live 1:1 chat with any lawyer — sign in with Google or email-OTP.' },
  { icon: Video, label: 'Instant video consultation — we mint a private room in one click.' },
  { icon: Building2, label: 'Profiles with photos, expertise, bio — book a slot when available.' },
]

const STORAGE_KEY = 'whats-new:v1'

export function WhatsNewPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try { if (!localStorage.getItem(STORAGE_KEY)) setOpen(true) } catch {}
  }, [])

  const close = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()) } catch {}
    setOpen(false)
  }
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={close}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-[#0e1219] animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#14203E] via-[#1c2c52] to-[#B7913D]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <Scale className="pointer-events-none absolute right-6 top-6 h-7 w-7 text-white/40" />
          <button onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-black/20 p-1.5 text-white hover:bg-black/30">
            <X className="h-4 w-4" />
          </button>
          <div className="relative px-6 pb-10 pt-10 text-center text-white sm:px-10 sm:pb-12 sm:pt-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              <Sparkles className="h-3 w-3" /> Introducing
            </span>
            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Find a Barrister</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              Find lawyers and firms across India in seconds. Chat, video-call, and book consultations — all from one place.
            </p>
          </div>
        </div>
        <div className="space-y-3 bg-white p-6 dark:bg-[#0e1219]">
          {FEATURES.map(({ icon: Ic, label }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <Ic className="h-4 w-4" />
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-200">{label}</p>
            </div>
          ))}
          <div className="mt-5 flex flex-col items-stretch justify-center gap-2 sm:flex-row">
            <a href="/find-barrister" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent">
              Find a Barrister <ArrowRight className="h-4 w-4" />
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
