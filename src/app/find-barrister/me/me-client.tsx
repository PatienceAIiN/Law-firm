'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, LogOut, MessageSquare, Search, User2, Loader2 } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'

type Thread = {
  id: string; subject: string | null; lastMessageAt: string
  firmName: string; firmSlug: string; advocateName: string | null
  lastPreview: string; lastSenderType: string | null
}

export function MeClient({ user, threads }: { user: { email: string; name: string | null; image: string | null }; threads: Thread[] }) {
  const router = useRouter()
  const [list, setList] = useState(threads)
  const [busy, setBusy] = useState(false)

  const deleteThread = async (id: string) => {
    const ok = await confirmDialog({ title: 'Delete chat?', message: 'The lawyer will lose this thread on their end too.', confirmLabel: 'Delete', tone: 'danger' })
    if (!ok) return
    const r = await fetch(`/api/dm/${id}`, { method: 'DELETE' })
    if (r.ok) setList((l) => l.filter((t) => t.id !== id))
    else alert((await r.json()).error || 'Failed')
  }

  const deleteAccount = async () => {
    const ok = await confirmDialog({
      title: 'Delete your account?',
      message: 'This permanently removes your profile and every chat with every firm. There is no undo.',
      confirmLabel: 'Delete forever', tone: 'danger',
    })
    if (!ok) return
    setBusy(true)
    try {
      const r = await fetch('/api/client/me', { method: 'DELETE' })
      if (!r.ok) throw new Error((await r.json()).error || 'Failed')
      await signOut({ callbackUrl: '/find-barrister' })
    } catch (e: any) { alert(e?.message || 'Delete failed'); setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img src={user.image} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-200" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white"><User2 className="h-6 w-6" /></div>
            )}
            <div>
              <p className="text-sm font-bold text-primary dark:text-white">{user.name || user.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/find-barrister" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <Search className="h-3.5 w-3.5" /> Browse directory
            </Link>
            <button onClick={() => signOut({ callbackUrl: '/find-barrister' })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary dark:text-white">
            <MessageSquare className="h-4 w-4" /> Your chats
          </h2>
          {list.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-[#11151f]">
              No chats yet. <Link href="/find-barrister" className="text-primary underline dark:text-amber-300">Find a barrister</Link> to start a conversation.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-[#11151f]">
              {list.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary dark:text-white">
                      {t.advocateName ? `${t.advocateName} · ${t.firmName}` : t.firmName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{t.lastPreview || t.subject || 'Conversation started'}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{new Date(t.lastMessageAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.firmSlug && (
                      <Link href={`/team/${t.firmSlug}`} className="rounded-lg border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10">
                        Open firm
                      </Link>
                    )}
                    <button onClick={() => deleteThread(t.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" aria-label="Delete chat">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 dark:border-rose-500/20 dark:bg-rose-900/10">
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-200">Delete account</h3>
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">Removes your Find-Barrister profile and every chat with every firm. There's no undo — the lawyers can no longer see your conversations.</p>
          <button onClick={deleteAccount} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete my account
          </button>
        </section>
      </main>
    </div>
  )
}
