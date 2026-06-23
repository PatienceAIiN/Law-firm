import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { TenantAvailabilityClient } from './availability-client'

export const dynamic = 'force-dynamic'

export default async function TenantAvailabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const days = await prisma.availabilityDay.findMany({
    where: { tenantId: tenant.id },
    orderBy: { date: 'asc' },
    include: { advocate: { select: { name: true } }, slots: { include: { bookings: true }, orderBy: { startTime: 'asc' } } },
    take: 60,
  })
  
  const advocates = await prisma.advocate.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Availability &amp; Bookings</h2>
      <TenantAvailabilityClient
        slug={slug}
        advocates={advocates}
        days={days.map((d) => ({
          id: d.id,
          date: d.date.toISOString(),
          advocateName: d.advocate?.name || null,
          slots: d.slots.map((s) => ({
            id: s.id,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            capacity: s.capacity,
            bookedCount: s.bookedCount,
            bookings: s.bookings.map((b) => ({ id: b.id, name: b.name, email: b.email, phone: b.phone, status: b.status, meetingMode: b.meetingMode })),
          })),
        }))}
      />
    </TenantAdminShell>
  )
}
