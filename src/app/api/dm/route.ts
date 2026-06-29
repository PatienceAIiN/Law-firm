import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { clientAuthOptions } from '@/lib/client-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { publish } from '@/lib/dm-bus'

export const dynamic = 'force-dynamic'

async function resolveActor() {
  const client = await getServerSession(clientAuthOptions)
  if (client?.user?.email) return { kind: 'client' as const, email: (client.user.email as string).toLowerCase(), name: client.user.name || null }
  const admin = await getServerSession(tenantAdminAuthOptions)
  if (admin?.user) return { kind: 'admin' as const, id: (admin.user as any).id, tenantId: (admin.user as any).tenantId, name: admin.user.name || (admin.user as any).email }
  const lawyer = await getServerSession(tenantLawyerAuthOptions)
  if (lawyer?.user) return { kind: 'lawyer' as const, id: (lawyer.user as any).id, tenantId: (lawyer.user as any).tenantId, name: lawyer.user.name || (lawyer.user as any).email }
  return null
}

// GET ?threadId=… returns messages in a thread, or
// GET ?tenantId=…&advocateId=… returns the current client's thread for that target.
export async function GET(req: NextRequest) {
  const actor = await resolveActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sp = req.nextUrl.searchParams
  const threadId = sp.get('threadId')

  // Client lookup by (tenantId, advocateId) — used by ChatPanel on mount
  // so an existing conversation appears immediately instead of "blank
  // until first send".
  const lookupTenant = sp.get('tenantId')
  const lookupAdvocate = sp.get('advocateId')
  if (!threadId && lookupTenant && actor.kind === 'client') {
    const thread = await prisma.directThread.findFirst({
      where: { tenantId: lookupTenant, clientEmail: actor.email, advocateId: lookupAdvocate || null },
    })
    if (!thread) return NextResponse.json({ thread: null, messages: [] })
    const messages = await prisma.directMessage.findMany({ where: { threadId: thread.id }, orderBy: { createdAt: 'asc' }, take: 200 })
    return NextResponse.json({ thread, messages })
  }

  if (threadId) {
    const thread = await prisma.directThread.findUnique({ where: { id: threadId } })
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Scope check.
    if (actor.kind === 'client' && thread.clientEmail !== actor.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (actor.kind !== 'client' && thread.tenantId !== (actor as any).tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (actor.kind === 'lawyer' && thread.advocateId && thread.advocateId !== (actor as any).id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const messages = await prisma.directMessage.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' }, take: 200 })
    return NextResponse.json({ thread, messages })
  }

  // List threads for the actor.
  let threads: any[] = []
  if (actor.kind === 'client') {
    threads = await prisma.directThread.findMany({ where: { clientEmail: actor.email }, orderBy: { lastMessageAt: 'desc' }, take: 50 })
  } else {
    const where: any = { tenantId: (actor as any).tenantId }
    if (actor.kind === 'lawyer') where.advocateId = (actor as any).id
    threads = await prisma.directThread.findMany({ where, orderBy: { lastMessageAt: 'desc' }, take: 100 })
  }
  return NextResponse.json({ threads })
}

// POST { tenantId, advocateId?, body, subject? } — clients open / continue a thread.
// POST { threadId, body } — anyone in the thread replies.
export async function POST(req: NextRequest) {
  const actor = await resolveActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized — sign in to send a message.' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const text = (body?.body || '').toString().trim()
  if (!text) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  let thread = body?.threadId ? await prisma.directThread.findUnique({ where: { id: body.threadId } }) : null

  if (!thread) {
    if (actor.kind !== 'client') return NextResponse.json({ error: 'Only clients can start a new thread.' }, { status: 400 })
    const tenantId = body?.tenantId as string
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    const existing = await prisma.directThread.findFirst({
      where: { tenantId, clientEmail: actor.email, advocateId: body?.advocateId || null },
    })
    thread = existing || await prisma.directThread.create({
      data: {
        tenantId,
        advocateId: body?.advocateId || null,
        clientEmail: actor.email,
        clientName: actor.name || null,
        subject: body?.subject || null,
        lastMessageAt: new Date(),
      },
    })
  }

  // Scope check again for replies.
  if (actor.kind === 'client' && thread.clientEmail !== actor.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (actor.kind !== 'client' && thread.tenantId !== (actor as any).tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const message = await prisma.directMessage.create({
    data: {
      threadId: thread.id,
      senderType: actor.kind,
      senderId: actor.kind === 'client' ? null : (actor as any).id,
      senderName: actor.name || null,
      body: text,
    },
  })
  await prisma.directThread.update({ where: { id: thread.id }, data: { lastMessageAt: new Date() } })
  // SSE push — every subscriber on this thread receives the new message
  // in <100ms. Polling stays as a fallback when EventSource isn't open.
  publish(thread.id, { type: 'message', message })

  // Outgoing notification on the recipient side with a one-click
  // "Reply in app" deep-link CTA.
  try {
    const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
    const tenant = await prisma.tenant.findUnique({ where: { id: thread.tenantId } })
    if (actor.kind === 'client' && tenant) {
      const advocate = thread.advocateId ? await prisma.advocate.findUnique({ where: { id: thread.advocateId } }) : null
      const to = advocate?.email || tenant.ownerEmail
      const replyUrl = `${base}/team/${tenant.slug}/${advocate ? 'lawyer' : 'admin'}/chats`
      if (to) sendEmail({
        to,
        subject: `New chat from ${actor.email}`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14203E;"><h2 style="margin:0 0 12px">New message</h2><p style="background:#FFFCF8;border-left:3px solid #B7913D;padding:10px 14px;">${text.replace(/</g, '&lt;')}</p><p style="margin:18px 0;"><a href="${replyUrl}" style="display:inline-block;background:#14203E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Reply in app</a></p></div>`,
        textContent: `${text}\n\nReply: ${replyUrl}`,
      }).catch(() => {})
    } else if (tenant) {
      const replyUrl = `${base}/find-barrister/me`
      sendEmail({
        to: thread.clientEmail,
        subject: `Reply from ${tenant.name}`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14203E;"><h2 style="margin:0 0 12px">${tenant.name} replied</h2><p style="background:#FFFCF8;border-left:3px solid #B7913D;padding:10px 14px;">${text.replace(/</g, '&lt;')}</p><p style="margin:18px 0;"><a href="${replyUrl}" style="display:inline-block;background:#14203E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open chat</a></p></div>`,
        textContent: `${text}\n\nOpen chat: ${replyUrl}`,
      }).catch(() => {})
    }
  } catch {}

  return NextResponse.json({ thread, message })
}
