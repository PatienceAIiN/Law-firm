'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'

async function authedLawyer(slug: string) {
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string, advocateId: u.id as string }
}

export async function addLawyerSlot(slug: string, formData: FormData) {
  const { tenantId, advocateId } = await authedLawyer(slug)
  const dateStr = (formData.get('date') as string) || ''
  const start = (formData.get('startTime') as string) || ''
  const end = (formData.get('endTime') as string) || ''
  const capacity = parseInt((formData.get('capacity') as string) || '1', 10)
  const modes = (formData.get('modes') as string) || 'VIRTUAL,PHYSICAL'
  
  if (!dateStr || !start || !end) throw new Error('Date, start, and end are required')

  const dayDate = new Date(`${dateStr}T00:00:00.000Z`)
  const startDate = new Date(`${dateStr}T${start}:00`)
  const endDate = new Date(`${dateStr}T${end}:00`)
  if (endDate <= startDate) throw new Error('End must be after start')

  let day = await prisma.availabilityDay.findFirst({ where: { tenantId, date: dayDate, advocateId } })
  if (!day) day = await prisma.availabilityDay.create({ data: { date: dayDate, tenantId, isActive: true, advocateId } })

  await prisma.availabilitySlot.create({
    data: {
      dayId: day.id, startTime: startDate, endTime: endDate, capacity: Math.max(1, capacity), allowedModes: modes,
    },
  })
  revalidatePath(`/team/${slug}/lawyer`)
  revalidatePath(`/team/${slug}/admin/availability`)
  revalidatePath(`/team/${slug}`)
}

export async function deleteLawyerSlot(slug: string, slotId: string) {
  const { tenantId, advocateId } = await authedLawyer(slug)
  const slot = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, day: { tenantId, advocateId } },
  })
  if (!slot) throw new Error('Slot not found')
  await prisma.availabilitySlot.delete({ where: { id: slot.id } })
  revalidatePath(`/team/${slug}/lawyer`)
  revalidatePath(`/team/${slug}/admin/availability`)
  revalidatePath(`/team/${slug}`)
}
