import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { ArrowLeft } from 'lucide-react'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
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
    include: { slots: { include: { bookings: true }, orderBy: { startTime: 'asc' } } },
    take: 60,
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link href={`/t/${slug}/admin`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="mb-6 text-2xl font-black text-slate-900 dark:text-white">{tenant.name} · Availability & Bookings</h1>
        <TenantAvailabilityClient
          slug={slug}
          days={days.map((d) => ({
            id: d.id,
            date: d.date.toISOString(),
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
      </div>
    </div>
  )
}
