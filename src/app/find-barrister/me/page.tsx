import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { clientAuthOptions } from '@/lib/client-auth'
import { prisma } from '@/lib/prisma'
import { MeClient } from './me-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My account · Find Barrister' }

export default async function ClientMePage() {
  const session = await getServerSession(clientAuthOptions)
  const email = (session?.user?.email as string | undefined)?.toLowerCase()
  if (!email) redirect('/find-barrister')

  const [user, threads] = await Promise.all([
    prisma.clientUser.findUnique({ where: { email } }),
    prisma.directThread.findMany({
      where: { clientEmail: email },
      orderBy: { lastMessageAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }),
  ])

  // Resolve firm / advocate names without leaking other-tenant data.
  const tenantIds = Array.from(new Set(threads.map((t) => t.tenantId)))
  const tenants = tenantIds.length
    ? await prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true, slug: true } })
    : []
  const tenantMap: Record<string, { name: string; slug: string }> = Object.fromEntries(tenants.map((t) => [t.id, { name: t.name, slug: t.slug }]))

  const advocateIds = Array.from(new Set(threads.map((t) => t.advocateId).filter(Boolean))) as string[]
  const advocates = advocateIds.length
    ? await prisma.advocate.findMany({ where: { id: { in: advocateIds } }, select: { id: true, name: true } })
    : []
  const advocateMap: Record<string, string> = Object.fromEntries(advocates.map((a) => [a.id, a.name]))

  return (
    <MeClient
      user={{ email, name: user?.name || null, image: user?.image || null }}
      threads={threads.map((t) => ({
        id: t.id,
        subject: t.subject,
        lastMessageAt: t.lastMessageAt.toISOString(),
        firmName: tenantMap[t.tenantId]?.name || 'Firm',
        firmSlug: tenantMap[t.tenantId]?.slug || '',
        advocateName: t.advocateId ? advocateMap[t.advocateId] || null : null,
        lastPreview: t.messages[0]?.body || '',
        lastSenderType: t.messages[0]?.senderType || null,
      }))}
    />
  )
}
