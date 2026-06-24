'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { createAdvocate, deleteAdvocate } from '../actions'
import { DeleteButton } from '@/components/ui/delete-button'

type A = { id: string; name: string; email: string; isActive: boolean }

export function LawyersClient({ slug, items, seatLimit }: { slug: string; items: A[]; seatLimit: number }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    start(async () => {
      const result = await createAdvocate(slug, fd)
      if (result?.ok === false) {
        setError(result.error || 'Failed to invite lawyer')
        return
      }
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    })
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <p className="mb-3 text-xs text-slate-500">
          We'll email the lawyer an activation link. They set their own password — admins never see it.
          Each workspace can have up to {seatLimit} lawyers / lawyer portal seats. After activation they can sign in at <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/team/{slug}/lawyer/login</code>.
        </p>
        {error && <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Full name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="title" placeholder="Title (e.g. Lawyer)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="email" type="email" required placeholder="Email" className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <button disabled={pending || items.length >= seatLimit} className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {items.length >= seatLimit ? 'Seat limit reached' : 'Send invite'}
          </button>
        </form>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-white/10">{items.length}/{seatLimit} lawyer seats used</div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No lawyers yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-white">{a.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.email} ·{' '}
                    {a.isActive
                      ? <span className="text-emerald-600">active</span>
                      : <span className="text-amber-600">awaiting activation</span>}
                  </p>
                </div>
                <DeleteButton
                  onDelete={async () => { await deleteAdvocate(slug, a.id) }}
                  confirmMessage={`Remove ${a.name}?`}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
