import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { TestimonialsClient } from './testimonials-client'

export const dynamic = 'force-dynamic'

export default async function TenantTestimonialsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/admin/login`)

  // Order by createdAt only so the page still renders if the Testimonial.status
  // column hasn't been applied to the deployed DB yet. We bucket in JS.
  const all = await prisma.testimonial.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
  })
  const pending = all.filter((t: any) => t.status === 'PENDING')
  const published = all.filter((t: any) => !t.status || t.status !== 'PENDING')

  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Testimonials</h2>
      <TestimonialsClient
        slug={slug}
        pending={pending.map((t) => ({ id: t.id, name: t.name, role: t.role, content: t.content, rating: t.rating, createdAt: t.createdAt.toISOString() }))}
        published={published.map((t) => ({ id: t.id, name: t.name, role: t.role, content: t.content, rating: t.rating }))}
      />
    </TenantAdminShell>
  )
}
