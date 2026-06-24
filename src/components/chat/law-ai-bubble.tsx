'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, Check, Copy, Loader2, Scale, Send, Trash2, X, ChevronDown, ArrowUpRight } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface LawAiBubbleProps {
  onOpenConsultation?: () => void
  onOpenContact?: () => void
}

const SUGGESTIONS = [
  'What are my rights under Article 21?',
  'How do I file for divorce in India?',
  'Explain RERA for homebuyers',
  'What is anticipatory bail?',
  'Tell me about practice areas',
  'Book a consultation',
]

function NavChip({ label, href, onClick }: { label: string; href: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-[#14203E]/20 transition-transform hover:scale-[1.03] hover:shadow-amber-300/40"
    >
      <span>{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  )
}

// Build the per-tenant nav targets. When on /team/<slug>/* the chat
// suggests pages INSIDE that workspace; on the SaaS landing it falls back
// to the marketing flow.
function buildNavMap(tenantSlug?: string | null) {
  const base = tenantSlug ? `/team/${tenantSlug}` : ''
  return {
    navigate_home:            { label: 'Open home',            href: base || '/' },
    navigate_about:           { label: 'Open team',            href: tenantSlug ? `${base}/team` : '/' },
    navigate_practice_areas:  { label: 'Open practice areas',  href: tenantSlug ? `${base}/practice-areas` : '/' },
    navigate_blog:            { label: 'Open articles',        href: tenantSlug ? `${base}/articles` : '/' },
    navigate_testimonials:    { label: 'Open testimonials',    href: tenantSlug ? `${base}/team` : '/' },
    open_consultation:        { label: 'Book consultation',    href: tenantSlug ? `${base}/book` : '/signup' },
    open_contact:             { label: 'Open contact',         href: tenantSlug ? `${base}/contact` : '/' },
  } as Record<string, { label: string; href: string }>
}

function MessageBubble({ msg, tenantSlug }: { msg: Message & { triggerAction?: string }; tenantSlug?: string | null }) {
  const isUser = msg.role === 'user'
  const navAction: string | undefined = (msg as any).triggerAction
  const navMap = buildNavMap(tenantSlug)
  const navLabel = navAction ? navMap[navAction] : null

  return (
    <div className={`flex animate-fade-in gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div className="max-w-[82%] space-y-1.5">
        <div className={`rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-primary text-white shadow-sm'
            : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-white/10 dark:bg-[#1a2030] dark:text-slate-100'
        }`}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        {navLabel && navAction && (
          <NavChip
            label={navLabel.label}
            href={navLabel.href}
            onClick={() => {
              // Let the parent shell handle in-app vs. router navigation; the
              // link itself is just a hint, the click triggers the real route.
              window.location.assign(navLabel.href)
            }}
          />
        )}
      </div>
    </div>
  )
}

export function LawAiBubble({ onOpenConsultation, onOpenContact }: LawAiBubbleProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<(Message & { triggerAction?: string })[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idCollapsed, setIdCollapsed] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const shellRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pathname = usePathname()
  // Derive the current tenant slug from the URL so the LawAI bubble's CTAs
  // and the /api/chat lookup stay scoped to the active workspace. Routes
  // were renamed from /t/<slug> to /team/<slug>; we still match the old
  // form in case any legacy link is hit.
  const tenantSlug = (() => {
    const m = (pathname || '').match(/^\/(?:team|t)\/([^\/]+)/)
    return m ? m[1] : null
  })()
  const router = useRouter()

  // Persist conversation id PER tenant, so a chat started on workspace A
  // doesn't carry context into workspace B (the model would otherwise echo
  // the prior firm's name / details).
  const convKey = tenantSlug ? `law_ai_conversation_id:${tenantSlug}` : 'law_ai_conversation_id:_root'
  useEffect(() => {
    const saved = localStorage.getItem(convKey)
    setConversationId(saved || null)
    setMessages([])
  }, [convKey])
  useEffect(() => {
    if (conversationId) localStorage.setItem(convKey, conversationId)
  }, [conversationId, convKey])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Close on route change
  useEffect(() => {
    setOpen(false)
    setIdCollapsed(true)
  }, [pathname])

  // Note: intentionally NO click-outside auto-close — it was closing the chat
  // mid-conversation on stray clicks. Users close via the X or the toggle button.

  // Cycle suggestions
  useEffect(() => {
    if (messages.length > 0) return
    const t = setInterval(() => setSuggestionIndex(i => (i + 1) % SUGGESTIONS.length), 4000)
    return () => clearInterval(t)
  }, [messages.length])

  const copyConversationId = async () => {
    if (!conversationId) return
    await navigator.clipboard.writeText(conversationId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const clearConversation = async () => {
    if (clearing || (!conversationId && messages.length === 0)) return
    if (!window.confirm('Clear this conversation?')) return
    setClearing(true)
    try {
      if (conversationId) {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deleteConversation', conversationId }),
        })
      }
      localStorage.removeItem('law_ai_conversation_id')
      setConversationId(null)
      setMessages([])
      setInput('')
      setError(null)
    } finally {
      setClearing(false)
    }
  }

  const handleNavigation = useCallback((action: string) => {
    const map = buildNavMap(tenantSlug)
    const target = map[action]
    if (!target) return
    if (action === 'open_consultation' && onOpenConsultation) {
      onOpenConsultation()
      setOpen(false)
      return
    }
    if (action === 'open_contact' && onOpenContact) {
      onOpenContact()
      setOpen(false)
      return
    }
    router.push(target.href)
    setOpen(false)
  }, [router, onOpenConsultation, onOpenContact, tenantSlug])

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    setInput('')
    setError(null)

    const userMsg: Message = { role: 'user', content: messageText, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, conversationId, tenantSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      const assistantMsg = {
        role: 'assistant' as const,
        content: data.reply,
        timestamp: new Date().toISOString(),
        triggerAction: data.triggerAction || undefined,
      }
      setMessages(prev => [...prev, assistantMsg])
      if (data.conversationId) setConversationId(data.conversationId)
      // Don't auto-navigate — the navigation chip is rendered inline; the user
      // taps it explicitly. Auto-navigating was closing the chat unexpectedly.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect.')
    } finally {
      setLoading(false)
    }
  }, [conversationId, input, loading, handleNavigation])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const visibleSuggestions = messages.length === 0
    ? SUGGESTIONS.slice(suggestionIndex, suggestionIndex + 3).concat(
        SUGGESTIONS.slice(0, Math.max(0, (suggestionIndex + 3) - SUGGESTIONS.length))
      ).slice(0, 3)
    : []

  return (
    <div ref={shellRef}>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-black/10 animate-pop-in sm:right-6 dark:border-white/10 dark:bg-[#0e1219] dark:shadow-black/40"
          style={{ width: 'min(92vw, 400px)', height: 'min(620px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-primary via-[#1c2c52] to-primary px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-300/20 ring-1 ring-amber-300/30">
                <Scale className="h-4 w-4 text-amber-200" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">LAW AI</div>
                <div className="text-[9px] font-medium text-white/60">Workspace-scoped · Indian law</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearConversation} disabled={clearing} className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50" title="Clear conversation">
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation ID (collapsible) */}
          <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-white/10 dark:bg-[#11151f]">
            <button onClick={() => setIdCollapsed(v => !v)} className="flex w-full items-center gap-2 text-left">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Memory Session</span>
              <ChevronDown className={`ml-auto h-3 w-3 text-slate-400 transition-transform ${idCollapsed ? '' : 'rotate-180'}`} />
            </button>
            {!idCollapsed && (
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  {conversationId || 'New session'}
                </code>
                {conversationId && (
                  <button onClick={copyConversationId} className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-primary dark:hover:bg-white/10 dark:hover:text-white">
                    {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto px-3 py-4 dark:bg-[#0e1219]">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="flex animate-fade-in gap-2.5">
                  <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-[#1a2030]">
                    <p className="text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-100">
                      Hi — I&apos;m <span className="font-bold text-primary dark:text-amber-300">LAW AI</span>. Ask a quick legal question, find a page on this site, or book a consultation. I keep answers short and to the point.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-9">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Try asking</p>
                  {visibleSuggestions.map((q) => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 transition-all hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm dark:border-white/10 dark:bg-[#1a2030] dark:text-slate-200 dark:hover:border-amber-500/40 dark:hover:bg-amber-900/20">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} tenantSlug={tenantSlug} />
            ))}

            {loading && (
              <div className="flex animate-fade-in gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-[#1a2030]">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-900/30 dark:text-rose-200">{error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#11151f]">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-amber-400 focus-within:bg-white dark:border-white/10 dark:bg-white/5 dark:focus-within:bg-[#1a2030]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Indian law…"
                rows={1}
                className="max-h-24 flex-1 resize-none bg-transparent text-[13.5px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-all hover:bg-accent disabled:bg-slate-200 dark:disabled:bg-white/10"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[9px] font-medium text-slate-400 dark:text-slate-500">General guidance only · Not legal advice</p>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => { setOpen(v => !v); setIdCollapsed(true) }}
        className="group fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-br from-primary via-[#1c2c52] to-accent px-4 py-3 text-white shadow-2xl shadow-[#14203E]/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-300/40 sm:right-6"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 transition group-hover:bg-white/25">
          <Scale className="h-4 w-4" />
        </div>
        <span className="pr-1 text-[10px] font-bold uppercase tracking-[0.2em]">{open ? 'Close' : 'LAW AI'}</span>
      </button>
    </div>
  )
}
