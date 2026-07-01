import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions'
import { prisma } from '@/lib/prisma'
import { buildFallbackReply, buildSystemPrompt, retrieveRelevantDocs } from '@/lib/rag'
import { rateLimit, clientIp } from '@/lib/rate-limit'

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

function getTriggerAction(message: string, _reply: string): string | null {
  const m = message.toLowerCase().trim()

  // Imperative intents — "open X", "show me Y", "take me to Z", "go to W".
  const wantsAction = /\b(open|show( me)?|take me to|go to|navigate|visit|see)\b/.test(m)

  // IMPORTANT: keep these checks ordered MOST SPECIFIC first. The team check
  // sits above navigate_home so "open team" never falls through to home.
  if (/\b(book|consultation|appointment|schedule( a)? slot|consult|meet(ing)?)\b/.test(m)) return 'open_consultation'
  if (/\b(contact|inquir|reach (out|us)|message|email( us)?|address|phone|directions?)\b/.test(m)) return 'open_contact'
  if (/\b(practice areas?|services|legal services|specializ|expertise|criminal|corporate|family law|property law|labour|civil|matrimonial)\b/.test(m)) return 'navigate_practice_areas'
  // Team-page words get their own action so the chip label reads "Open team".
  if (/\b(team|lawyers?|advocates?|partners?|members?|our firm|firm history)\b/.test(m)) return 'navigate_team'
  // "About us / who are you / philosophy" still routes to the team page (that's where the firm bio lives) — same action key so the chip label stays accurate.
  if (/\b(about( us)?|who (are|is) (you|we)|philosophy)\b/.test(m)) return 'navigate_team'
  if (/\b(articles?|blog|legal news|updates?|posts?|insights?)\b/.test(m)) return 'navigate_blog'
  if (/\b(testimonials?|reviews?|client feedback|client stories)\b/.test(m)) return 'navigate_testimonials'
  if (/\b(home(page)?|main page|landing|start|back to home)\b/.test(m)) return 'navigate_home'

  // Generic "open/show/take me to" with no specific page named — default to
  // home so the user always gets a button.
  if (wantsAction) return 'navigate_home'

  return null
}

// STRICT tenant isolation. If the caller has no slug (SaaS landing) we
// return a minimal, EMPTY site context — never another firm's data. If
// the slug is unknown we also bail. This makes cross-tenant data leakage
// in LawAI replies impossible by construction.
async function fetchSiteData(tenantSlug?: string | null) {
  if (!tenantSlug) return undefined
  try {
    const tenant = await (prisma as any).tenant?.findUnique({
      where: { slug: tenantSlug.toLowerCase() },
    })
    if (!tenant) return undefined
    const tenantId = tenant.id as string
    let firmName: string | undefined = tenant.name

    // EVERY query below filters on tenantId. No global / null-tenant
    // fallback — a tenant's assistant can ONLY see its own rows.
    const [profile, practiceAreas, teamMembers, faqs, articles, brandSetting] = await Promise.all([
      (prisma as any).aboutProfile?.findFirst({ where: { tenantId } }),
      (prisma as any).practiceArea?.findMany({ where: { tenantId, isActive: true }, orderBy: { order: 'asc' }, take: 20 }),
      (prisma as any).teamMember?.findMany({ where: { tenantId, isActive: true }, orderBy: { order: 'asc' }, take: 20 }),
      (prisma as any).faq?.findMany({ where: { tenantId, isActive: true }, orderBy: { order: 'asc' }, take: 30 }).catch(() => []),
      (prisma as any).blogPost?.findMany({ where: { tenantId, status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: 10 }),
      (prisma as any).siteSetting?.findFirst({ where: { tenantId, key: 'brand_config' } }),
    ])

    const officeDetails = (() => {
      if (!profile?.officeDetails) return {}
      try { return JSON.parse(profile.officeDetails) } catch { return {} }
    })()

    let brand: any = {}
    if (brandSetting?.value) { try { brand = JSON.parse(brandSetting.value) } catch {} }
    firmName = brand?.firm_full_name || brand?.firm_name || firmName

    return {
      firmName,
      tenantSlug,
      officeAddress: officeDetails?.address || undefined,
      officePhone: officeDetails?.phone || undefined,
      officeEmail: officeDetails?.email || undefined,
      practiceAreas: (practiceAreas || []).map((p: any) => ({ title: p.title, description: p.description, slug: p.slug })),
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
    // LLM calls cost real money — cap anonymous usage per IP.
    const rl = await rateLimit(`chat:${clientIp(req)}`, 30, 600)
    if (!rl.ok) return NextResponse.json({ error: 'Too many messages. Please slow down.' }, { status: 429 })
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
