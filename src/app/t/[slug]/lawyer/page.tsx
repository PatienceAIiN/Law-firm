import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { TenantLawyerClient } from './tenant-lawyer-client'

export const dynamic = 'force-dynamic'

export default async function TenantLawyerDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const session = await getServerSession(tenantLawyerAuthOptions)
  const sUser: any = session?.user
  if (!sUser?.id || sUser.tenantSlug !== tenant.slug) {
    redirect(`/t/${tenant.slug}/lawyer/login`)
  }

  const [advocate, cases, accessLogs, bookings] = await Promise.all([
    prisma.advocate.findFirst({
      where: { id: sUser.id, tenantId: tenant.id },
      select: { id: true, name: true, email: true, title: true, bio: true, phone: true },
    }),
    prisma.courtCase.findMany({
      where: { advocateId: sUser.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
    prisma.accessLog.findMany({
      where: { advocateId: sUser.id },
      orderBy: { loginTime: 'desc' },
      take: 10,
    }),
    prisma.consultationBooking.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      include: { slot: { include: { day: true } } },
    }),
  ])

  if (!advocate) {
    redirect(`/t/${tenant.slug}/lawyer/login`)
  }

  return (
    <TenantLawyerClient
      tenant={tenant}
      advocate={advocate}
      cases={cases.map((c) => ({ id: c.id, caseNumber: c.caseNumber, title: c.title, status: c.status, clientName: c.clientName }))}
      accessLogs={accessLogs.map((a) => ({ id: a.id, loginTime: a.loginTime.toISOString(), ipAddress: a.ipAddress || '' }))}
      bookings={bookings.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        subject: b.subject,
        meetingMode: b.meetingMode,
        status: b.status,
        startTime: b.slot.startTime.toISOString(),
        meetingLink: b.meetingLink,
      }))}
    />
  )
}
