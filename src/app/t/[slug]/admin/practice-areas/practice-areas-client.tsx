'use client'

import { useTransition } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { createPracticeArea, deletePracticeArea } from '../actions'

type P = { id: string; title: string; slug: string; description: string }

export function PracticeAreasClient({ slug, items }: { slug: string; items: P[] }) {
  const [pending, start] = useTransition()
  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => { await createPracticeArea(slug, fd); (e.target as HTMLFormElement).reset() })
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input name="title" required placeholder="Title (e.g. Corporate Law)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="description" placeholder="Short description" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <button disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </form>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No practice areas yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--primary)] dark:text-white">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.slug}{p.description ? ` · ${p.description}` : ''}</p>
                </div>
                <form action={async () => { await deletePracticeArea(slug, p.id) }}>
                  <button className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
