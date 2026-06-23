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
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const items = await prisma.testimonial.findMany({ where: { tenantId: tenant.id }, orderBy: { order: 'asc' } })
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-[#14203E] dark:text-white">Testimonials</h2>
      <TestimonialsClient slug={slug} items={items.map((t) => ({ id: t.id, name: t.name, role: t.role, content: t.content, rating: t.rating }))} />
    </TenantAdminShell>
  )
}
