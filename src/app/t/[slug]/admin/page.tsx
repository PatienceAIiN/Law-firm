import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminClient } from './tenant-admin-client'

export const dynamic = 'force-dynamic'

export default async function TenantAdminDashboard({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const session = await getServerSession(tenantAdminAuthOptions)
  const sUser: any = session?.user
  if (!sUser?.id || sUser.tenantSlug !== tenant.slug) {
    redirect(`/t/${tenant.slug}/admin/login`)
  }

  const [practiceAreas, blogPosts, advocates, inquiries] = await Promise.all([
    prisma.practiceArea.findMany({ where: { tenantId: tenant.id }, orderBy: { order: 'asc' } }),
    prisma.blogPost.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' } }),
    prisma.advocate.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' } }),
    prisma.contactSubmission.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' }, take: 25 }),
  ])

  return (
    <TenantAdminClient
      tenant={tenant}
      currentUser={{ id: sUser.id, name: session!.user!.name || sUser.email, email: sUser.email || '' }}
      practiceAreas={practiceAreas.map((p) => ({ id: p.id, title: p.title, slug: p.slug, order: p.order, isActive: p.isActive }))}
      blogPosts={blogPosts.map((b) => ({ id: b.id, title: b.title, slug: b.slug, status: b.status }))}
      advocates={advocates.map((a) => ({ id: a.id, name: a.name, email: a.email, isActive: a.isActive }))}
      inquiries={inquiries.map((i) => ({ id: i.id, fullName: i.fullName, email: i.email, subject: i.subject, message: i.message, createdAt: i.createdAt.toISOString() }))}
    />
  )
}
