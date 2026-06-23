import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { ArrowLeft } from 'lucide-react'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link href={`/t/${slug}/admin`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="mb-6 text-2xl font-black text-slate-900 dark:text-white">{tenant.name} · Cases</h1>
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
      </div>
    </div>
  )
}
