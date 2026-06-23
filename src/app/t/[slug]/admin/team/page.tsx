import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { TeamClient } from './team-client'

export const dynamic = 'force-dynamic'

export default async function TenantTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const members = await prisma.teamMember.findMany({ where: { tenantId: tenant.id }, orderBy: { order: 'asc' } })
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Team</h2>
      <TeamClient slug={slug} items={members.map((m) => ({ id: m.id, name: m.name, title: m.title, bio: m.bio, email: m.email, isActive: m.isActive }))} />
    </TenantAdminShell>
  )
}
