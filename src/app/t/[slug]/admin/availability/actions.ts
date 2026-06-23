'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'

async function authed(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string }
}

export async function addSlot(slug: string, formData: FormData) {
  const { tenantId } = await authed(slug)
  const dateStr = (formData.get('date') as string) || ''
  const start = (formData.get('startTime') as string) || ''
  const end = (formData.get('endTime') as string) || ''
  const capacity = parseInt((formData.get('capacity') as string) || '1', 10)
  if (!dateStr || !start || !end) throw new Error('Date, start, and end are required')

  const dayDate = new Date(`${dateStr}T00:00:00.000Z`)
  const startDate = new Date(`${dateStr}T${start}:00`)
  const endDate = new Date(`${dateStr}T${end}:00`)
  if (endDate <= startDate) throw new Error('End must be after start')

  let day = await prisma.availabilityDay.findFirst({ where: { tenantId, date: dayDate } })
  if (!day) day = await prisma.availabilityDay.create({ data: { date: dayDate, tenantId, isActive: true } })

  await prisma.availabilitySlot.create({
    data: {
      dayId: day.id, startTime: startDate, endTime: endDate, capacity: Math.max(1, capacity), allowedModes: 'VIRTUAL,PHYSICAL',
    },
  })
  revalidatePath(`/t/${slug}/admin/availability`)
  revalidatePath(`/t/${slug}`)
}

export async function deleteSlot(slug: string, slotId: string) {
  const { tenantId } = await authed(slug)
  // Ensure slot is within this tenant by joining via day.
  const slot = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, day: { tenantId } },
  })
  if (!slot) throw new Error('Slot not found')
  await prisma.availabilitySlot.delete({ where: { id: slot.id } })
  revalidatePath(`/t/${slug}/admin/availability`)
}
