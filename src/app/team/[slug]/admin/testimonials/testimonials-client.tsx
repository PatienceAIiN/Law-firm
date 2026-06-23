'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Star, Send, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { askTestimonial, approveTestimonial, rejectTestimonial, deleteTestimonial } from './actions'

type P = { id: string; name: string; role: string | null; content: string; rating: number; createdAt: string }
type T = { id: string; name: string; role: string | null; content: string; rating: number }

export function TestimonialsClient({ slug, pending, published }: { slug: string; pending: P[]; published: T[] }) {
  const [busy, start] = useTransition()
  const router = useRouter()

  const onAsk = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      await askTestimonial(slug, fd)
      router.refresh()
      ;(e.target as HTMLFormElement).reset()
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <div className="mb-3 flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-bold text-primary dark:text-white">Ask for a testimonial</h3></div>
        <p className="mb-3 text-xs text-slate-500">We'll email the client a link to leave a rating + note. You review before it shows on your site.</p>
        <form onSubmit={onAsk} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input name="clientName" required placeholder="Client name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="clientEmail" type="email" required placeholder="Client email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <button disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send invite
          </button>
        </form>
      </div>

      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/5">
          <div className="border-b border-amber-200/60 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-200">
            Awaiting your review ({pending.length})
          </div>
          <ul className="divide-y divide-amber-200/40 dark:divide-amber-500/20">
            {pending.map((t) => (
              <li key={t.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role || '—'} · {new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex">
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#c9a227] text-[#c9a227]" />)}
                  </div>
                </div>
                <p className="mt-2 text-sm italic text-slate-700 dark:text-slate-200">"{t.content}"</p>
                <div className="mt-3 flex gap-2">
                  <form action={async () => { await approveTestimonial(slug, t.id); router.refresh() }}>
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve & publish
                    </button>
                  </form>
                  <form action={async () => { await rejectTestimonial(slug, t.id); router.refresh() }}>
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                      <XCircle className="h-3.5 w-3.5" /> Discard
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <div className="border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-white/10">
          Published ({published.length})
        </div>
        {published.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No published testimonials yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {published.map((t) => (
              <li key={t.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#c9a227] text-[#c9a227]" />)}</div>
                    <form action={async () => { await deleteTestimonial(slug, t.id); router.refresh() }}>
                      <button className="rounded-md p-1 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                    </form>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">"{t.content}"</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
