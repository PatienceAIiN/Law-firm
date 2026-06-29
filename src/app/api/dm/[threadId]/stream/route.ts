import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { clientAuthOptions } from '@/lib/client-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'
import { subscribe } from '@/lib/dm-bus'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const client = await getServerSession(clientAuthOptions)
  const admin = client ? null : await getServerSession(tenantAdminAuthOptions)
  const lawyer = client || admin ? null : await getServerSession(tenantLawyerAuthOptions)

  const thread = await prisma.directThread.findUnique({ where: { id: threadId } })
  if (!thread) return new Response('Not found', { status: 404 })
  if (client?.user?.email) {
    if (thread.clientEmail !== (client.user.email as string).toLowerCase()) return new Response('Forbidden', { status: 403 })
  } else if (admin?.user) {
    if (thread.tenantId !== (admin.user as any).tenantId) return new Response('Forbidden', { status: 403 })
  } else if (lawyer?.user) {
    if (thread.tenantId !== (lawyer.user as any).tenantId) return new Response('Forbidden', { status: 403 })
    if (thread.advocateId && thread.advocateId !== (lawyer.user as any).id) return new Response('Forbidden', { status: 403 })
  } else {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`: connected\n\n`))
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)) } catch {}
      }, 25000)
      const off = subscribe(threadId, (data) => {
        try { controller.enqueue(encoder.encode(`data: ${data}\n\n`)) } catch {}
      })
      ;(controller as any)._cleanup = () => { clearInterval(ping); off() }
    },
    cancel() {
      try { (this as any)._cleanup?.() } catch {}
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
