'use client'

import { useMemo, useState } from 'react'
import { Copy, MessageSquareText, Search, Hash, Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

type ChatConversation = {
  id: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

interface AiChatManagerProps {
  initialConversations: ChatConversation[]
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AiChatManager({ initialConversations }: AiChatManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id || '')

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return initialConversations

    return initialConversations.filter((conversation) => {
      if (conversation.id.toLowerCase().includes(query)) return true
      return conversation.messages.some((message) => message.content.toLowerCase().includes(query))
    })
  }, [initialConversations, searchQuery])

  const selectedConversation =
    filteredConversations.find((conversation) => conversation.id === selectedId) ||
    filteredConversations[0] ||
    null

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversation id or message"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-[#0f172a] outline-none transition-colors focus:border-[#0a192f]"
          />
        </div>

        <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
          {filteredConversations.map((conversation) => {
            const isActive = conversation.id === selectedId
            const firstLine = conversation.messages.find((message) => message.role === 'user')?.content || 'Empty conversation'
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={cn(
                  'w-full rounded-[24px] border p-4 text-left transition-all',
                  isActive
                    ? 'border-[#c5a059] bg-[#c5a059]/5 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#0f172a]">
                      <Hash className="h-3.5 w-3.5 text-[#c5a059]" />
                      {conversation.id}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-700">{firstLine}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {conversation.messages.length} msgs
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDateTime(conversation.updatedAt)}
                </div>
              </button>
            )
          })}

          {filteredConversations.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center">
              <MessageSquareText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                No conversations found
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        {selectedConversation ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c5a059]">Conversation</p>
                <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-[#0f172a]">
                  {selectedConversation.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(selectedConversation.id)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-[#0a192f] hover:text-[#0a192f]"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy ID
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Created</p>
                <p className="mt-1 text-sm font-bold text-[#0f172a]">{formatDateTime(selectedConversation.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Updated</p>
                <p className="mt-1 text-sm font-bold text-[#0f172a]">{formatDateTime(selectedConversation.updatedAt)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Messages</p>
                <p className="mt-1 text-sm font-bold text-[#0f172a]">{selectedConversation.messages.length}</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
              {selectedConversation.messages.map((message, index) => (
                <div
                  key={`${selectedConversation.id}-${index}`}
                  className={cn(
                    'max-w-4xl rounded-[24px] border p-4',
                    message.role === 'user'
                      ? 'ml-auto border-[#0a192f]/10 bg-[#0a192f] text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800'
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className={cn(
                      'text-[10px] font-black uppercase tracking-[0.24em]',
                      message.role === 'user' ? 'text-white/60' : 'text-slate-400'
                    )}>
                      {message.role}
                    </p>
                    {message.timestamp && (
                      <p className={cn(
                        'text-[10px] font-bold uppercase tracking-[0.2em]',
                        message.role === 'user' ? 'text-white/50' : 'text-slate-400'
                      )}>
                        {formatDateTime(message.timestamp)}
                      </p>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Select a conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
