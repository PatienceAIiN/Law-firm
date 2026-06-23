'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Mail, Inbox, Send, Trash2, RefreshCw, Loader2, Search, X, Plus,
  Star, AlertTriangle, Plug, ArrowLeft, Paperclip, ExternalLink,
} from 'lucide-react'

type Status = { configured: boolean; connected: boolean; email: string | null }
type ListItem = { id: string; from: string; to: string; subject: string; snippet: string; date: string; unread: boolean }
type FullMsg = ListItem & { html: string; text: string }

const FOLDERS = [
  { id: 'INBOX', name: 'Inbox', icon: Inbox },
  { id: 'SENT', name: 'Sent', icon: Send },
  { id: 'STARRED', name: 'Starred', icon: Star },
  { id: 'TRASH', name: 'Trash', icon: Trash2 },
]

function parseName(from: string) {
  const m = from.match(/^(.*?)\s*<(.+)>$/)
  return m ? m[1].replace(/"/g, '') || m[2] : from
}

export function MailClient({ basePath = '/api/admin/mail', fullScreen = false }: { basePath?: string; fullScreen?: boolean } = {}) {
  const fullPagePath = basePath.includes('/lawyer') ? '/lawyer/mail' : '/admin/mail'
  const [status, setStatus] = useState<Status | null>(null)
  const [folder, setFolder] = useState('INBOX')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<FullMsg | null>(null)
  const [compose, setCompose] = useState<{ to: string; subject: string; body: string } | null>(null)
  const [attachments, setAttachments] = useState<{ filename: string; mimeType: string; data: string; size: number }[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const ATT_LIMIT = 20 * 1024 * 1024
  const totalAttSize = attachments.reduce((s, a) => s + a.size, 0)

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    setError('')
    for (const file of Array.from(files)) {
      if (totalAttSize + file.size > ATT_LIMIT) { setError('Attachments exceed the 20 MB limit'); break }
      const data: string = await new Promise((resolve) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result).split(',')[1] || '')
        r.readAsDataURL(file)
      })
      setAttachments((prev) => [...prev, { filename: file.name, mimeType: file.type || 'application/octet-stream', data, size: file.size }])
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const closeCompose = () => { setCompose(null); setAttachments([]) }

  const loadStatus = useCallback(async () => {
    const res = await fetch(`${basePath}/status`)
    if (res.status === 401) {
      const loginPath = basePath.includes('/lawyer') ? '/lawyer/login' : '/admin/login'
      const next = encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : fullPagePath)
      if (typeof window !== 'undefined') window.location.href = `${loginPath}?callbackUrl=${next}`
      return
    }
    if (res.ok) setStatus(await res.json())
  }, [basePath, fullPagePath])

  // If the OAuth callback just landed us here with ?connected=true, poll the
  // status endpoint until it reports connected=true (Google may take a moment
  // to propagate). Show a loading screen during the wait.
  const [postConnect, setPostConnect] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (url.searchParams.get('connected') !== 'true') return
    setPostConnect(true)
    let cancelled = false
    let attempts = 0
    const tick = async () => {
      attempts++
      const res = await fetch(`${basePath}/status`).catch(() => null)
      if (!cancelled && res?.ok) {
        const data = await res.json()
        setStatus(data)
        if (data.connected) {
          setPostConnect(false)
          url.searchParams.delete('connected')
          window.history.replaceState({}, '', url.toString())
          return
        }
      }
      if (!cancelled && attempts < 15) setTimeout(tick, 800)
      else if (!cancelled) setPostConnect(false)
    }
    tick()
    return () => { cancelled = true }
  }, [basePath])

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ labelId: folder })
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`${basePath}/messages?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'GMAIL_NOT_CONNECTED') { setStatus((s) => s ? { ...s, connected: false } : s); return }
        throw new Error(data.error || 'Failed to load')
      }
      setItems(data.items || [])
    } catch (e: any) {
      setError(e?.message || 'Could not load mail')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [folder, query])

  useEffect(() => { loadStatus() }, [loadStatus])

  // Load + poll when connected.
  useEffect(() => {
    if (!status?.connected) return
    loadMessages()
    pollRef.current = setInterval(() => loadMessages(true), 20000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [status?.connected, folder, loadMessages])

  const openMessage = async (id: string) => {
    setSelected(null)
    setLoading(true)
    try {
      const res = await fetch(`${basePath}/messages/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSelected(data)
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)))
    } catch (e: any) {
      setError(e?.message || 'Could not open message')
    } finally {
      setLoading(false)
    }
  }

  const deleteMessage = async (id: string) => {
    await fetch(`${basePath}/messages/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((m) => m.id !== id))
    if (selected?.id === id) setSelected(null)
    setToast('Moved to Trash')
    setTimeout(() => setToast(''), 2500)
  }

  const sendMail = async () => {
    if (!compose) return
    setSending(true)
    try {
      const res = await fetch(`${basePath}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...compose, attachments: attachments.map((a) => ({ filename: a.filename, mimeType: a.mimeType, data: a.data })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      closeCompose()
      setToast('Email sent')
      setTimeout(() => setToast(''), 2500)
      if (folder === 'SENT') loadMessages(true)
    } catch (e: any) {
      setError(e?.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  // ── Not configured / not connected states ──────────────────────────────────
  if (status && !status.configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <Plug className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[var(--primary)]">Gmail not configured</h2>
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
          Add <code className="bg-white px-1 rounded">GOOGLE_CLIENT_ID</code> and <code className="bg-white px-1 rounded">GOOGLE_CLIENT_SECRET</code> to your
          environment (Gmail API enabled, redirect URI <code className="bg-white px-1 rounded">/api/admin/mail/callback</code>), then reload.
        </p>
      </div>
    )
  }

  if (status && !status.connected) {
    return (
      <div className="rounded-2xl border border-[#F4E8D8] bg-[#FFFCF8] p-10 text-center">
        <Mail className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
        <h2 className="text-lg font-bold text-[var(--primary)]">Connect your Gmail</h2>
        <p className="text-sm text-gray-500 mt-2 mb-5">Sign in with Google to manage email inside the portal.</p>
        <a href={`${basePath}/connect`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--accent)]">
          <Plug className="w-4 h-4" /> Connect Gmail
        </a>
      </div>
    )
  }

  if (postConnect || !status) {
    return (
      <div className="rounded-2xl border border-[#F4E8D8] bg-[#FFFCF8] p-10 text-center dark:border-white/10 dark:bg-white/5">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--primary)] dark:text-white/80" />
        <h2 className="text-lg font-bold text-[var(--primary)] dark:text-white">
          {postConnect ? 'Finishing Gmail setup…' : 'Loading mailbox…'}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {postConnect ? 'Securely authorizing your account with Google.' : 'Fetching your messages.'}
        </p>
      </div>
    )
  }

  // ── Connected: Gmail-like 3-pane ────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-[#F4E8D8] bg-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#F4E8D8] px-4 py-3 bg-[#FFFCF8]">
        <div className="flex items-center gap-2 text-sm text-[var(--primary)]">
          <Mail className="w-4 h-4 text-[#64748b]" />
          <span className="font-semibold">{status.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMessages()}
              placeholder="Search mail…"
              className="pl-8 pr-3 py-1.5 rounded-lg border border-[#F4E8D8] text-sm w-44 focus:w-60 transition-all outline-none"
            />
          </div>
          <button onClick={() => loadMessages()} title="Refresh" className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[#F4E8D8]">
            <RefreshCw className={`w-4 h-4 text-[#64748b] ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!fullScreen && (
            <a href={fullPagePath} target="_blank" rel="noopener noreferrer" title="Open in new tab" className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[#F4E8D8]">
              <ExternalLink className="w-4 h-4 text-[#64748b]" />
            </a>
          )}
          <button onClick={() => setCompose({ to: '', subject: '', body: '' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--accent)]">
            <Plus className="w-3.5 h-3.5" /> Compose
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border-b border-red-100 px-4 py-2 text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-[160px_1fr] lg:grid-cols-[180px_360px_1fr] min-h-[60vh]">
        {/* Folders */}
        <div className="border-r border-[#F4E8D8] p-2 space-y-1 bg-[#FFFCF8]">
          {FOLDERS.map((f) => {
            const Icon = f.icon
            return (
              <button
                key={f.id}
                onClick={() => { setFolder(f.id); setSelected(null) }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${folder === f.id ? 'bg-[var(--primary)] text-white' : 'text-[#475569] hover:bg-[#F6F0E8]'}`}
              >
                <Icon className="w-4 h-4" /> {f.name}
              </button>
            )
          })}
        </div>

        {/* Message list */}
        <div className={`border-r border-[#F4E8D8] overflow-y-auto max-h-[70vh] ${selected ? 'hidden lg:block' : ''}`}>
          {loading && items.length === 0 && (
            <div className="flex items-center gap-2 text-gray-400 text-sm p-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">No messages.</div>
          )}
          {items.map((m) => (
            <button
              key={m.id}
              onClick={() => openMessage(m.id)}
              className={`w-full text-left px-4 py-3 border-b border-[#F6F0E8] hover:bg-[#FFFCF8] ${selected?.id === m.id ? 'bg-[#FFFCF8]' : ''} ${m.unread ? 'bg-blue-50/40' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${m.unread ? 'font-bold text-[var(--primary)]' : 'text-[#475569]'}`}>
                  {parseName(folder === 'SENT' ? m.to : m.from)}
                </span>
                <span className="text-[10px] text-gray-400 shrink-0">{m.date ? new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
              </div>
              <div className={`text-xs truncate ${m.unread ? 'font-semibold text-[var(--primary)]' : 'text-gray-600'}`}>{m.subject || '(no subject)'}</div>
              <div className="text-xs text-gray-400 truncate">{m.snippet}</div>
            </button>
          ))}
        </div>

        {/* Reading pane */}
        <div className={`overflow-y-auto max-h-[70vh] ${selected ? '' : 'hidden lg:flex'} ${!selected ? 'items-center justify-center' : ''}`}>
          {!selected ? (
            <div className="text-sm text-gray-400 p-10 text-center w-full">Select a message to read.</div>
          ) : (
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-[#FFFCF8]"><ArrowLeft className="w-4 h-4" /></button>
                <h2 className="text-lg font-bold text-[var(--primary)] flex-1">{selected.subject || '(no subject)'}</h2>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCompose({ to: parseName(selected.from).includes('@') ? selected.from : (selected.from.match(/<(.+)>/)?.[1] || ''), subject: `Re: ${selected.subject}`, body: '' })} title="Reply" className="p-2 rounded-lg hover:bg-[#FFFCF8]"><Send className="w-4 h-4 text-[#64748b]" /></button>
                  <button onClick={() => deleteMessage(selected.id)} title="Delete" className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <div className="text-xs text-gray-500 border-b border-[#F6F0E8] pb-3 mb-3">
                <div><strong>From:</strong> {selected.from}</div>
                <div><strong>To:</strong> {selected.to}</div>
                <div>{selected.date ? new Date(selected.date).toLocaleString('en-IN') : ''}</div>
              </div>
              {selected.html ? (
                <iframe title="email-body" className="w-full min-h-[40vh] border-0" srcDoc={selected.html} sandbox="allow-same-origin" />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-[var(--primary)] font-sans">{selected.text || selected.snippet}</pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {compose && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl border border-[#F4E8D8] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--primary)] text-white">
              <span className="text-sm font-semibold">New Message</span>
              <button onClick={closeCompose}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} placeholder="To" className="w-full px-3 py-2 rounded-lg border border-[#F4E8D8] text-sm outline-none" />
              <input value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} placeholder="Subject" className="w-full px-3 py-2 rounded-lg border border-[#F4E8D8] text-sm outline-none" />
              <textarea value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} placeholder="Write your message…" rows={7} className="w-full px-3 py-2 rounded-lg border border-[#F4E8D8] text-sm outline-none resize-y" />

              {/* Attachments */}
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              {attachments.length > 0 && (
                <div className="space-y-1.5">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-[#F4E8D8] bg-[#FFFCF8] px-3 py-1.5 text-xs">
                      <span className="flex items-center gap-2 truncate text-[var(--primary)]"><Paperclip className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{a.filename}</span></span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[#64748b]">{a.size > 1048576 ? `${(a.size / 1048576).toFixed(1)} MB` : `${Math.ceil(a.size / 1024)} KB`}</span>
                        <button onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><X className="h-3.5 w-3.5" /></button>
                      </span>
                    </div>
                  ))}
                  <div className="text-[11px] text-[#64748b]">{(totalAttSize / 1048576).toFixed(1)} MB of 20 MB</div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#F4E8D8] px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[#FFFCF8]">
                  <Paperclip className="h-4 w-4" /> Attach
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={closeCompose} className="px-4 py-2 rounded-lg border border-[#F4E8D8] text-sm">Cancel</button>
                  <button onClick={sendMail} disabled={sending || !compose.to} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold disabled:opacity-60">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[130] bg-[var(--primary)] text-white text-sm px-4 py-2 rounded-xl shadow-lg">{toast}</div>
      )}
    </div>
  )
}
