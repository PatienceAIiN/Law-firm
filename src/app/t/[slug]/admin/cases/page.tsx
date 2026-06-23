import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { TenantCasesClient } from './cases-client'

export const dynamic = 'force-dynamic'

export default async function TenantCasesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const [cases, advocates] = await Promise.all([
    prisma.courtCase.findMany({
      where: { tenantId: tenant.id },
      orderBy: { updatedAt: 'desc' },
      include: { advocate: { select: { id: true, name: true } } },
    }),
    prisma.advocate.findMany({ where: { tenantId: tenant.id, isActive: true }, select: { id: true, name: true, email: true } }),
  ])

  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-[#14203E] dark:text-white">Cases</h2>
      <TenantCasesClient
          slug={slug}
          cases={cases.map((c) => ({
            id: c.id,
            caseNumber: c.caseNumber,
            title: c.title,
            status: c.status,
            court: c.court,
            clientName: c.clientName,
            advocateName: c.advocate?.name || null,
            nextHearingDate: c.nextHearingDate?.toISOString() || null,
          }))}
          advocates={advocates}
        />
    </TenantAdminShell>
  )
}
