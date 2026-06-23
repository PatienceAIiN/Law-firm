'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, Check, Copy, Loader2, Scale, Send, Trash2, X, ChevronDown, ExternalLink } from 'lucide-react'

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
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#F4E8D8]/40 bg-[#F6F0E8]/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-[#F6F0E8]/20 transition-colors"
    >
      <ExternalLink className="w-3 h-3" />{label}
    </button>
  )
}

// Rewrites legacy hard-coded paths to live inside the current tenant when the
// chat is opened on a /t/<slug>/... page.
function buildNavMap(tenantSlug?: string | null) {
  const base = tenantSlug ? `/t/${tenantSlug}` : ''
  return {
    navigate_home: { label: 'Go to Home', href: base || '/' },
    navigate_about: { label: 'About', href: tenantSlug ? `${base}/team` : '/' },
    navigate_practice_areas: { label: 'Practice Areas', href: tenantSlug ? `${base}/practice-areas` : '/' },
    navigate_blog: { label: 'Articles', href: tenantSlug ? `${base}/articles` : '/' },
    open_consultation: { label: 'Consult', href: tenantSlug ? `${base}/book` : '/signup' },
    open_contact: { label: 'Contact', href: tenantSlug ? `${base}/contact` : '/' },
  } as Record<string, { label: string; href: string }>
}

function MessageBubble({ msg, tenantSlug }: { msg: Message & { triggerAction?: string }; tenantSlug?: string | null }) {
  const isUser = msg.role === 'user'
  const navAction: string | undefined = (msg as any).triggerAction

  const navMap = buildNavMap(tenantSlug)
  const navLabel = navAction ? navMap[navAction] : null

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="max-w-[82%] space-y-1.5">
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-primary font-medium text-white'
            : 'rounded-tl-sm border border-gray-100 bg-[#f8fafc] font-medium text-gray-700'
        }`}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        {navLabel && triggerNav && (
          <NavChip label={navLabel.label} href={navLabel.href} onClick={() => navAction && triggerNav(navAction)} />
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
  // always navigate inside the same workspace.
  const tenantSlug = (() => {
    const match = (pathname || '').match(/^\/t\/([^\/]+)/)
    return match ? match[1] : null
  })()
  const router = useRouter()

  // Persist conversation id
  useEffect(() => {
    const saved = localStorage.getItem('law_ai_conversation_id')
    if (saved) setConversationId(saved)
  }, [])
  useEffect(() => {
    if (conversationId) localStorage.setItem('law_ai_conversation_id', conversationId)
  }, [conversationId])

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
        body: JSON.stringify({ message: messageText, conversationId }),
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

      // Auto-navigate after short delay
      if (data.triggerAction) {
        setTimeout(() => handleNavigation(data.triggerAction), 1400)
      }
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
          className="fixed bottom-24 right-4 z-50 flex flex-col rounded-[1.75rem] border border-gray-100 bg-white shadow-2xl transition-all duration-200 sm:right-6"
          style={{ width: 'min(92vw, 420px)', height: 'min(640px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-[1.75rem] bg-primary px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F6F0E8]/20">
                <Scale className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-white">LAW AI</div>
                <div className="text-[9px] font-semibold text-white/50">Indian Legal Assistant · Memory Enabled</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearConversation} disabled={clearing} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors" title="Clear conversation">
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation ID (collapsible) */}
          <div className="flex-shrink-0 border-b border-gray-100 bg-[#f8fafc] px-4 py-2">
            <button onClick={() => setIdCollapsed(v => !v)} className="flex w-full items-center gap-2 text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Memory Session</span>
              <ChevronDown className={`ml-auto h-3 w-3 text-gray-400 transition-transform ${idCollapsed ? '' : 'rotate-180'}`} />
            </button>
            {!idCollapsed && (
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-gray-100 px-2 py-1 font-mono text-[10px] text-gray-500">
                  {conversationId || 'New session'}
                </code>
                {conversationId && (
                  <button onClick={copyConversationId} className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-primary transition-colors">
                    {copiedId ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="flex gap-2.5">
                  <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-gray-100 bg-[#f8fafc] px-4 py-3">
                    <p className="text-sm font-medium leading-relaxed text-gray-700">
                      Namaste! I&apos;m <span className="font-black text-primary">LAW AI</span> — your expert Indian legal assistant. I can help with any law question, navigate to pages, or book a consultation. I remember our conversation!
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-9">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Try asking</p>
                  {visibleSuggestions.map((q) => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-primary transition-all hover:border-[#F4E8D8] hover:bg-[#F6F0E8]/5">
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
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-[#f8fafc] px-4 py-3">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-[#F6F0E8]" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-500">{error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-100 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 py-2 transition-colors focus-within:border-[#F4E8D8]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Indian law…"
                rows={1}
                className="max-h-24 flex-1 resize-none bg-transparent text-sm font-medium leading-relaxed text-primary outline-none placeholder:text-gray-400"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-[#F6F0E8] disabled:bg-gray-200"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[9px] font-medium text-gray-400">General guidance only · Not legal advice</p>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => { setOpen(v => !v); setIdCollapsed(true) }}
        className="group fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full bg-primary px-4 py-3 text-white shadow-2xl shadow-[#14203E]/30 transition-all duration-300 hover:scale-105 hover:bg-[#F6F0E8] sm:right-6"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20">
          <Scale className="h-4 w-4" />
        </div>
        <span className="pr-1 text-[10px] font-black uppercase tracking-widest">{open ? 'Close' : 'LAW AI'}</span>
      </button>
    </div>
  )
}
