'use client'

import { useEffect, useState, useRef } from 'react'
import { Star, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

type Testimonial = { id: string; name: string; role: string | null; content: string; rating: number }

export function TestimonialCarousel({ items, intervalMs = 5500 }: { items: Testimonial[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused || items.length < 2) return
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, intervalMs)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [paused, items.length, intervalMs])

  if (items.length === 0) return null
  const t = items[index]

  const advance = (dir: 1 | -1) => {
    setPaused(true)
    setIndex((i) => (i + dir + items.length) % items.length)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="absolute right-0 top-0 z-10 flex h-7 items-center gap-1 rounded-full bg-white/90 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#14203E] shadow ring-1 ring-black/5 backdrop-blur dark:bg-white/10 dark:text-white"
      >
        {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        {paused ? 'Play' : 'Pause'}
      </button>

      <figure
        onClick={() => setPaused((p) => !p)}
        className="cursor-pointer rounded-2xl border border-[#F4E8D8] bg-white p-8 shadow-sm transition dark:border-white/10 dark:bg-[#11151f]"
        key={t.id}
      >
        <div className="flex">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-[#c9a227] text-[#c9a227]" />
          ))}
        </div>
        <blockquote className="mt-4 text-lg italic leading-relaxed text-slate-800 dark:text-slate-100">
          "{t.content}"
        </blockquote>
        <figcaption className="mt-5 text-sm">
          <span className="font-semibold text-[#14203E] dark:text-white">{t.name}</span>
          {t.role && <span className="text-slate-500"> · {t.role}</span>}
        </figcaption>
      </figure>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIndex(i); setPaused(true) }}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-1.5 w-6 rounded-full transition-all ${i === index ? 'bg-[#14203E] dark:bg-white' : 'bg-[#14203E]/20 dark:bg-white/20'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => advance(-1)}
              aria-label="Previous testimonial"
              className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => advance(1)}
              aria-label="Next testimonial"
              className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
