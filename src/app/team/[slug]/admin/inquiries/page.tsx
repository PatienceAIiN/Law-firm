import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { TenantInquiriesClient } from './inquiries-client'

export const dynamic = 'force-dynamic'

export default async function TenantInquiriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/admin/login`)

  const items = await prisma.contactSubmission.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  const advocates = await prisma.advocate.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Inquiries</h2>
      <TenantInquiriesClient slug={slug} items={items} advocates={advocates} />
    </TenantAdminShell>
  )
}
