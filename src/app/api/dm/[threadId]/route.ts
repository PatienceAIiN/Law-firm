import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { clientAuthOptions } from '@/lib/client-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const client = await getServerSession(clientAuthOptions)
  const admin = client ? null : await getServerSession(tenantAdminAuthOptions)
  const lawyer = client || admin ? null : await getServerSession(tenantLawyerAuthOptions)

  const thread = await prisma.directThread.findUnique({ where: { id: threadId } })
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (client?.user?.email) {
    if (thread.clientEmail !== (client.user.email as string).toLowerCase()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else if (admin?.user) {
    if (thread.tenantId !== (admin.user as any).tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else if (lawyer?.user) {
    if (thread.tenantId !== (lawyer.user as any).tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (thread.advocateId && thread.advocateId !== (lawyer.user as any).id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.directThread.delete({ where: { id: threadId } })
  return NextResponse.json({ ok: true })
}
