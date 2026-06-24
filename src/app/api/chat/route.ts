import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions'
import { prisma } from '@/lib/prisma'
import { buildFallbackReply, buildSystemPrompt, retrieveRelevantDocs } from '@/lib/rag'

let groqClient: Groq | null = null
let groqClientKey: string | null = null

function resolveGroqApiKey() {
  const value = process.env.GROQ_API_KEY?.trim()
  if (!value) return null
  return value.replace(/^['"]|['"]$/g, '')
}

function getGroqClient() {
  const apiKey = resolveGroqApiKey()
  if (!apiKey) return null

  if (!groqClient || groqClientKey !== apiKey) {
    groqClient = new Groq({ apiKey })
    groqClientKey = apiKey
  }

  return groqClient
}

function getGroqModelCandidates() {
  const models = [
    process.env.GROQ_MODEL?.trim(),
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ]

  return Array.from(new Set(models.filter((model): model is string => Boolean(model))))
}

function getTriggerAction(message: string, reply: string): string | null {
  const m = message.toLowerCase()
  const r = reply.toLowerCase()

  // Consultation booking
  if (
    (m.includes('book') || m.includes('consultation') || m.includes('appointment') || m.includes('schedule') || m.includes('slot')) &&
    (r.includes('consultation') || r.includes('booking') || r.includes('appointment') || r.includes('slot'))
  ) return 'open_consultation'

  // Contact
  if ((m.includes('contact') || m.includes('inquir') || m.includes('reach') || m.includes('email') || m.includes('address')) && !m.includes('consultation'))
    return 'open_contact'

  // Navigate home
  if (m.match(/\b(home|homepage|main page|start|go home|back to home)\b/))
    return 'navigate_home'

  // Navigate about
  if (m.match(/\b(about|about us|our firm|firm history|team|who are you|advocacy|philosophy)\b/))
    return 'navigate_about'

  // Navigate practice areas
  if (m.match(/\b(practice areas?|services|legal services|what do you do|specializ|expertise|criminal|corporate|family law|property law|labour)\b/))
    return 'navigate_practice_areas'

  // Navigate blog
  if (m.match(/\b(blog|articles?|legal news|updates?|read|posts?)\b/))
    return 'navigate_blog'

  return null
}

// Resolve site data scoped to a tenant when a tenantSlug is provided. If the
// caller is on the SaaS landing (no slug) or the slug doesn't match, we fall
// back to the global/default-tenant rows so the assistant still has context.
async function fetchSiteData(tenantSlug?: string | null) {
  try {
    let tenantId: string | null = null
    let firmName: string | undefined
    if (tenantSlug) {
      const t = await (prisma as any).tenant?.findUnique({ where: { slug: tenantSlug.toLowerCase() } })
      if (t) { tenantId = t.id; firmName = t.name }
    }

    // Build prisma `where` clauses that prefer the tenant scope when known,
    // else fall back to the global (null-tenantId) rows.
    const scope = (extra: Record<string, any> = {}) =>
      tenantId ? { ...extra, tenantId } : { ...extra }

    const [profile, practiceAreas, teamMembers, faqs, articles, brandSetting] = await Promise.all([
      (prisma as any).aboutProfile?.findFirst({ where: tenantId ? { tenantId } : {} }),
      (prisma as any).practiceArea?.findMany({ where: scope({ isActive: true }), orderBy: { order: 'asc' }, take: 20 }),
      (prisma as any).teamMember?.findMany({ where: scope({ isActive: true }), orderBy: { order: 'asc' }, take: 20 }),
      (prisma as any).faq?.findMany({ where: { isActive: true }, orderBy: { order: 'asc' }, take: 30 }),
      (prisma as any).blogPost?.findMany({ where: scope({ status: 'PUBLISHED' }), orderBy: { publishedAt: 'desc' }, take: 10 }),
      (prisma as any).siteSetting?.findFirst({ where: tenantId ? { tenantId, key: 'brand_config' } : { key: 'brand_config' } }),
    ])

    const officeDetails = (() => {
      if (!profile?.officeDetails) return {}
      try { return JSON.parse(profile.officeDetails) } catch { return {} }
    })()

    let brand: any = {}
    if (brandSetting?.value) { try { brand = JSON.parse(brandSetting.value) } catch {} }
    if (!firmName) firmName = brand?.firm_full_name || brand?.firm_name || profile?.name

    return {
      firmName,
      tenantSlug: tenantSlug || undefined,
      officeAddress: officeDetails?.address || undefined,
      officePhone: officeDetails?.phone || undefined,
      officeEmail: officeDetails?.email || undefined,
      practiceAreas: (practiceAreas || []).map((p: any) => ({ title: p.title, description: p.description })),
      teamMembers: (teamMembers || []).map((m: any) => ({ name: m.name, title: m.title, expertise: m.expertise })),
      articles: (articles || []).map((b: any) => ({ title: b.title, excerpt: b.excerpt, slug: b.slug })),
      faqs: (faqs || []).map((f: any) => ({ question: f.question, answer: f.answer })),
    }
  } catch {
    return undefined
  }
}

async function generateAssistantReply(
  message: string,
  history: Array<{ role: string; content: string }>,
  tenantSlug?: string | null,
) {
  const relevantDocs = retrieveRelevantDocs(message, 3)
  const groq = getGroqClient()

  if (!groq) {
    return buildFallbackReply(message, relevantDocs)
  }

  const siteData = await fetchSiteData(tenantSlug)

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(relevantDocs, siteData) },
    ...history.slice(-10).map((entry) =>
      (entry.role === 'assistant'
        ? { role: 'assistant', content: entry.content }
        : { role: 'user', content: entry.content }) as ChatCompletionMessageParam
    ),
    { role: 'user', content: message },
  ]

  let lastError: unknown = null

  for (const model of getGroqModelCandidates()) {
    try {
      const completion = await groq.chat.completions.create({
        model: model as any,
        messages,
        max_tokens: 360,
        temperature: 0.25,
      })

      let reply = completion.choices[0]?.message?.content?.trim()
      if (reply) {
        // Strip stray code blocks / fences if the model ever produces them —
        // the system prompt forbids code but this is a safety net.
        reply = reply
          .replace(/```[\s\S]*?```/g, '')
          .replace(/^\s*[-*]?\s*Great question[!.,:]?\s*/i, '')
          .replace(/^\s*Sure[,.!]?\s*/i, '')
          .replace(/^\s*As an AI[^.]*\.\s*/i, '')
          .trim()
        return reply
      }
    } catch (error: any) {
      lastError = error
      continue
    }
  }

  console.error('[Chat API Error]', lastError)
  return buildFallbackReply(message, relevantDocs)
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, action, tenantSlug } = await req.json()

    if (action === 'deleteConversation') {
      if (!conversationId) {
        return NextResponse.json({ error: 'Conversation id is required' }, { status: 400 })
      }

      await (prisma as any).chatConversation.delete({ where: { id: conversationId } })
      return NextResponse.json({ success: true })
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let conversation: { id: string; messages: string } | null = null

    if (conversationId) {
      conversation = await (prisma as any).chatConversation.findUnique({
        where: { id: conversationId },
      })
    }

    const previousMessages: Array<{ role: string; content: string; timestamp: string }> =
      conversation ? JSON.parse(conversation.messages) : []

    const assistantMessage = await generateAssistantReply(
      message,
      previousMessages.map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
      typeof tenantSlug === 'string' ? tenantSlug : null,
    )

    const triggerAction = getTriggerAction(message, assistantMessage)
    const now = new Date().toISOString()
    const updatedMessages = [
      ...previousMessages,
      { role: 'user', content: message, timestamp: now },
      { role: 'assistant', content: assistantMessage, timestamp: now },
    ]

    let savedConversation: { id: string }
    if (conversation) {
      savedConversation = await (prisma as any).chatConversation.update({
        where: { id: conversation.id },
        data: { messages: JSON.stringify(updatedMessages) },
      })
    } else {
      savedConversation = await (prisma as any).chatConversation.create({
        data: { messages: JSON.stringify(updatedMessages) },
      })
    }

    return NextResponse.json({
      reply: assistantMessage,
      conversationId: savedConversation.id,
      triggerAction,
    })
  } catch (error: any) {
    console.error('[Chat API Fatal Error]', error)
    return NextResponse.json({ error: 'AI service unavailable. Please try again shortly.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ messages: [] })

  try {
    const conversation = await (prisma as any).chatConversation.findUnique({
      where: { id },
    })
    if (!conversation) return NextResponse.json({ messages: [] })
    return NextResponse.json({ messages: JSON.parse(conversation.messages) })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Conversation id is required' }, { status: 400 })
  }

  try {
    await (prisma as any).chatConversation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to delete conversation' }, { status: 400 })
  }
}
