'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Send, Loader2, Trash2, StickyNote } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { markSeen } from '@/hooks/use-unread-counts'

type Thread = {
  id: string
  tenantId: string
  advocateId: string | null
  clientEmail: string
  clientName: string | null
  subject: string | null
  lastMessageAt: string
}

type Msg = { id: string; senderType: string; senderName: string | null; body: string; createdAt: string }

// Shared chat-tab panel — admin sees ALL workspace threads, a lawyer only
// sees threads where advocateId == their.id. Each thread also has private
// notes the firm can keep about the client (not shown to the client).
export function FirmChatsPanel({ role }: { role: 'admin' | 'lawyer' }) {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [open, setOpen] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadThreads = async () => {
    try { const r = await fetch('/api/dm', { cache: 'no-store' }); if (r.ok) setThreads((await r.json()).threads || []) } catch {}
  }
  const loadMessages = async (id: string) => {
    try { const r = await fetch(`/api/dm?threadId=${id}`, { cache: 'no-store' }); if (r.ok) { const data = await r.json(); setMessages(data.messages || []) } } catch {}
  }
  const loadNote = async (id: string) => {
    try { const r = await fetch(`/api/dm/${id}/note`, { cache: 'no-store' }); if (r.ok) { const data = await r.json(); setNote(data.note || '') } } catch {}
  }

  useEffect(() => {
    markSeen('chats')
    // Aggressive 2-second poll for the threads list — feels near-real-time.
    loadThreads()
    const t = window.setInterval(loadThreads, 2000)
    const onFocus = () => loadThreads()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus) }
  }, [])
  useEffect(() => {
    if (!open?.id) return
    loadMessages(open.id); loadNote(open.id)
    const es = new EventSource(`/api/dm/${open.id}/stream`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.message) setMessages((m) => (m.some((x) => x.id === data.message.id) ? m : [...m, data.message]))
      } catch {}
    }
    const t = window.setInterval(() => loadMessages(open.id), 5000) // safety net
    const onFocus = () => loadMessages(open.id)
    window.addEventListener('focus', onFocus)
    return () => { es.close(); clearInterval(t); window.removeEventListener('focus', onFocus) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!open || !body.trim() || sending) return
    setError(''); setSending(true)
    try {
      const r = await fetch('/api/dm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId: open.id, body: body.trim() }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setMessages((m) => [...m, data.message])
      setBody('')
    } catch (e: any) { setError(e?.message || 'Send failed') }
    finally { setSending(false) }
  }

  const saveNote = async () => {
    if (!open) return
    setNoteSaving(true); setNoteSaved(false)
    try {
      const r = await fetch(`/api/dm/${open.id}/note`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) })
      if (r.ok) { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000) }
    } finally { setNoteSaving(false) }
  }

  const deleteThread = async () => {
    if (!open) return
    const ok = await confirmDialog({ title: 'Delete chat?', message: 'The thread + every message disappears from both ends.', confirmLabel: 'Delete', tone: 'danger' })
    if (!ok) return
    const r = await fetch(`/api/dm/${open.id}`, { method: 'DELETE' })
    if (r.ok) { setOpen(null); setThreads((l) => l.filter((t) => t.id !== open.id)); router.refresh() }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={`rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f] ${open ? 'hidden lg:block' : ''}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{role === 'admin' ? 'All firm chats' : 'Your chats'}</p>
          <span className="text-[10px] text-slate-400">{threads.length}</span>
        </div>
        {threads.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-slate-500">No conversations yet.</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto">
            {threads.map((t) => (
              <li key={t.id}>
                <button onClick={() => setOpen(t)} className={`flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5 ${open?.id === t.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{t.clientName || t.clientEmail}</p>
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{t.subject || 'Conversation'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(t.lastMessageAt).toLocaleDateString()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className={`rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f] ${open ? '' : 'hidden lg:block'}`}>
        {!open ? (
          <div className="flex h-[60vh] items-center justify-center text-center text-sm text-slate-500">
            <div>
              <MessageSquare className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2">Select a chat to read messages and add private notes.</p>
            </div>
          </div>
        ) : (
          <div className="flex h-[70vh] flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
              <button
                onClick={() => setOpen(null)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 lg:hidden dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
              >
                ← Chats
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-primary dark:text-white">{open.clientName || open.clientEmail}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{open.clientEmail}</p>
              </div>
              <button onClick={deleteThread} className="flex-shrink-0 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" title="Delete chat">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderType === 'client' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderType === 'client' ? 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100' : 'bg-primary text-white'}`}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">{m.senderName || m.senderType} · {new Date(m.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-slate-200 p-2 dark:border-white/10">
              {error && <p className="mb-1 text-xs text-rose-600">{error}</p>}
              <div className="flex items-end gap-2">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Reply…"
                  rows={1}
                  className="max-h-20 flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
                />
                <button onClick={send} disabled={sending || !body.trim()} className="rounded-lg bg-primary p-2 text-white disabled:opacity-60">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="border-t border-slate-200 p-3 dark:border-white/10">
              <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <StickyNote className="h-3 w-3" /> Private notes (client never sees this)
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Background, important dates, follow-ups…"
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-slate-800 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-amber-50"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                {noteSaved && <span className="text-[11px] text-emerald-600">Saved</span>}
                <button onClick={saveNote} disabled={noteSaving} className="rounded-lg border border-slate-300 px-3 py-1 text-[11px] font-semibold hover:bg-slate-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10">
                  {noteSaving ? 'Saving…' : 'Save note'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
