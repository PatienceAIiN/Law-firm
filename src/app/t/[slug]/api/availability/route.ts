import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantBySlug } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return NextResponse.json({ days: [] })

  const now = new Date()
  const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const days = await prisma.availabilityDay.findMany({
    where: { tenantId: tenant.id, isActive: true, date: { gte: new Date(now.toISOString().slice(0, 10)), lte: horizon } },
    orderBy: { date: 'asc' },
    include: {
      advocate: { select: { id: true, name: true, title: true } },
      slots: {
        where: { isActive: true, startTime: { gte: now } },
        orderBy: { startTime: 'asc' },
        select: { id: true, startTime: true, endTime: true, capacity: true, bookedCount: true, allowedModes: true },
      },
    },
  })

  return NextResponse.json({
    advocates: await prisma.advocate.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, name: true, title: true },
      orderBy: { name: 'asc' }
    }),
    days: days
      .map((d) => ({
        date: d.date.toISOString().slice(0, 10),
        advocateId: d.advocateId,
        advocateName: d.advocate?.name,
        slots: d.slots
          .filter((s) => s.bookedCount < s.capacity)
          .map((s) => ({
            id: s.id,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            seatsLeft: s.capacity - s.bookedCount,
            modes: (s.allowedModes || 'VIRTUAL').split(',').map((x) => x.trim()).filter(Boolean),
          })),
      }))
      .filter((d) => d.slots.length > 0),
  })
}
