import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { Plus, Trash2 } from 'lucide-react'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { PracticeAreasClient } from './practice-areas-client'

export const dynamic = 'force-dynamic'

export default async function TenantPracticeAreasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const items = await prisma.practiceArea.findMany({ where: { tenantId: tenant.id }, orderBy: { order: 'asc' } })
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-[#14203E] dark:text-white">Practice areas</h2>
      <PracticeAreasClient slug={slug} items={items.map((p) => ({ id: p.id, title: p.title, slug: p.slug, description: p.description }))} />
    </TenantAdminShell>
  )
}
