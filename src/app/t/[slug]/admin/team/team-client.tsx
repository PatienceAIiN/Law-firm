'use client'

import { useTransition } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { createTeamMember, deleteTeamMember } from './actions'

type M = { id: string; name: string; title: string; bio: string; email: string | null; isActive: boolean }

export function TeamClient({ slug, items }: { slug: string; items: M[] }) {
  const [pending, start] = useTransition()
  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => { await createTeamMember(slug, fd); (e.target as HTMLFormElement).reset() })
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="title" placeholder="Title (e.g. Associate)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="email" type="email" placeholder="Email (optional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <textarea name="bio" rows={2} placeholder="Short bio" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <button disabled={pending} className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#14203E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add member
          </button>
        </form>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">No team members yet.</p> : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.title}{m.email ? ` · ${m.email}` : ''}</p>
                  {m.bio && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{m.bio}</p>}
                </div>
                <form action={async () => { await deleteTeamMember(slug, m.id) }}>
                  <button className="rounded-md p-1 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
