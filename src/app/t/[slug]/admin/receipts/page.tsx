import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { ArrowLeft } from 'lucide-react'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantReceiptsClient } from './receipts-client'

export const dynamic = 'force-dynamic'

export default async function TenantReceiptsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const receipts = await prisma.receipt.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link href={`/t/${slug}/admin`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="mb-6 text-2xl font-black text-slate-900 dark:text-white">{tenant.name} · Receipts</h1>
        <TenantReceiptsClient
          slug={slug}
          receipts={receipts.map((r) => ({
            id: r.id, number: r.number, clientName: r.clientName, clientEmail: r.clientEmail,
            total: r.total, currency: r.currency, status: r.status,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  )
}
