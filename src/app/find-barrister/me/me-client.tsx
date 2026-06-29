'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, LogOut, MessageSquare, Search, User2, Loader2, X, Send } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { useEffect, useRef } from 'react'

type Thread = {
  id: string; subject: string | null; lastMessageAt: string
  firmName: string; firmSlug: string; advocateName: string | null
  lastPreview: string; lastSenderType: string | null
}

export function MeClient({ user, threads }: { user: { email: string; name: string | null; image: string | null }; threads: Thread[] }) {
  const router = useRouter()
  const [list, setList] = useState(threads)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const deleteThread = async (id: string) => {
    const ok = await confirmDialog({ title: 'Delete chat?', message: 'The lawyer will lose this thread on their end too.', confirmLabel: 'Delete', tone: 'danger' })
    if (!ok) return
    setDeleting(id)
    try {
      const r = await fetch(`/api/dm/${id}`, { method: 'DELETE' })
      if (r.ok) setList((l) => l.filter((t) => t.id !== id))
      else alert((await r.json()).error || 'Failed')
    } finally { setDeleting(null) }
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
                    <button
                      onClick={() => setOpenId(t.id)}
                      className="rounded-lg bg-primary px-3 py-1 text-[10px] font-semibold text-white hover:bg-accent"
                    >
                      Continue chat
                    </button>
                    <button
                      onClick={() => deleteThread(t.id)}
                      disabled={deleting === t.id}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-900/20"
                      aria-label="Delete chat"
                    >
                      {deleting === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

      {openId && <ThreadChatModal threadId={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function ThreadChatModal({ threadId, onClose }: { threadId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const r = await fetch(`/api/dm?threadId=${threadId}`, { cache: 'no-store' })
      if (r.ok && alive) setMessages((await r.json()).messages || [])
    }
    load()
    const es = new EventSource(`/api/dm/${threadId}/stream`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.message) setMessages((m) => (m.some((x) => x.id === data.message.id) ? m : [...m, data.message]))
      } catch {}
    }
    return () => { alive = false; es.close() }
  }, [threadId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!body.trim() || sending) return
    setSending(true)
    try {
      const r = await fetch('/api/dm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId, body: body.trim() }) })
      const data = await r.json()
      if (r.ok) { setMessages((m) => [...m, data.message]); setBody('') }
    } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <div className="flex h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl dark:bg-[#11151f] animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <p className="text-sm font-bold text-primary dark:text-white">Conversation</p>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.senderType === 'client' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100'}`}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-70">{new Date(m.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-slate-200 p-2 dark:border-white/10">
          <div className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              rows={1}
              placeholder="Type a reply…"
              className="max-h-20 flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
            />
            <button onClick={send} disabled={sending || !body.trim()} className="rounded-lg bg-primary p-2 text-white disabled:opacity-60">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
