'use client'

import { useTransition } from 'react'
import { Plus, Trash2, Loader2, Star } from 'lucide-react'
import { createTestimonial, deleteTestimonial } from './actions'

type T = { id: string; name: string; role: string | null; content: string; rating: number }

export function TestimonialsClient({ slug, items }: { slug: string; items: T[] }) {
  const [pending, start] = useTransition()
  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => { await createTestimonial(slug, fd); (e.target as HTMLFormElement).reset() })
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <form onSubmit={onCreate} className="space-y-3">
          <input name="name" required placeholder="Client name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="role" placeholder="Role / company (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <textarea name="content" rows={3} required placeholder="Testimonial text" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <select name="rating" defaultValue="5" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white">
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
          </select>
          <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-[#14203E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add testimonial
          </button>
        </form>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">No testimonials yet.</p> : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-[#c9a227] text-[#c9a227]" />
                      ))}
                    </div>
                    <form action={async () => { await deleteTestimonial(slug, t.id) }}>
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
