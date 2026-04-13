import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { AiChatManager } from '@/components/admin/ai-chat-manager'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export const metadata: Metadata = {
  title: 'AI Chats | Admin Panel',
  description: 'Search and review LAW AI conversations by conversation ID',
}

export default async function AiChatsPage() {
  const conversations = await prisma.chatConversation.findMany({
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  })

  const initialConversations = conversations.map((conversation) => {
    let messages: ChatMessage[] = []

    try {
      const parsed = JSON.parse(conversation.messages)
      messages = Array.isArray(parsed)
        ? parsed
            .filter((entry) => entry && typeof entry.content === 'string')
            .map((entry) => ({
              role: entry.role === 'assistant' ? 'assistant' : 'user',
              content: entry.content,
              timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : undefined,
            }))
        : []
    } catch {
      messages = []
    }

    return {
      id: conversation.id,
      messages,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    }
  })

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-[#0a192f]">AI Chats</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Search LAW AI conversations by unique session ID and review message history.
        </p>
      </div>

      <AiChatManager initialConversations={initialConversations} />
    </div>
  )
}
