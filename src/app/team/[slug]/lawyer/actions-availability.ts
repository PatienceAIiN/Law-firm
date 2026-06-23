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

function bust(slug: string) {
  revalidatePath(`/team/${slug}/lawyer`)
  revalidatePath(`/team/${slug}/admin/availability`)
  revalidatePath(`/team/${slug}`)
}

export async function addLawyerSlot(
  slug: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { tenantId, advocateId } = await authedLawyer(slug)
    const dateStr = (formData.get('date') as string) || ''
    const start = (formData.get('startTime') as string) || ''
    const end = (formData.get('endTime') as string) || ''
    const capacity = parseInt((formData.get('capacity') as string) || '1', 10)
    const modes = (formData.get('modes') as string) || 'VIRTUAL,PHYSICAL'
    const physicalAddress = ((formData.get('physicalAddress') as string) || '').slice(0, 250).trim()

    if (!dateStr || !start || !end) return { ok: false, error: 'Date, start, and end are required' }
    if (modes.includes('PHYSICAL') && !physicalAddress) {
      return { ok: false, error: 'A meeting address is required for in-person slots.' }
    }

    const dayDate = new Date(`${dateStr}T00:00:00.000Z`)
    const startDate = new Date(`${dateStr}T${start}:00`)
    const endDate = new Date(`${dateStr}T${end}:00`)
    if (endDate <= startDate) return { ok: false, error: 'End must be after start' }

    let day = await prisma.availabilityDay.findFirst({ where: { tenantId, date: dayDate, advocateId } })
    if (!day) day = await prisma.availabilityDay.create({ data: { date: dayDate, tenantId, isActive: true, advocateId } })

    await prisma.availabilitySlot.create({
      data: {
        dayId: day.id,
        startTime: startDate,
        endTime: endDate,
        capacity: Math.max(1, capacity),
        allowedModes: modes,
        physicalAddress: modes.includes('PHYSICAL') ? physicalAddress : null,
      },
    })
    bust(slug)
    return { ok: true }
  } catch (e: any) {
    console.error('[addLawyerSlot]', e)
    return { ok: false, error: e?.message || 'Failed to add slot' }
  }
}

export async function deleteLawyerSlot(
  slug: string,
  slotId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { tenantId, advocateId } = await authedLawyer(slug)
    // Allow the lawyer to delete a slot that's either on their own day or on
    // a firm-level day (no specific advocate) — same scope they can view.
    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: slotId,
        day: { tenantId, OR: [{ advocateId }, { advocateId: null }] },
      },
      include: { _count: { select: { bookings: true } } },
    })
    if (!slot) return { ok: false, error: 'Slot not found or not yours to remove.' }

    // Cascading on the slot relation removes child bookings automatically; we
    // still wrap to log if Prisma rejects (e.g. legacy data without the
    // cascade applied).
    await prisma.availabilitySlot.delete({ where: { id: slot.id } })
    bust(slug)
    return { ok: true }
  } catch (e: any) {
    console.error('[deleteLawyerSlot]', e)
    return { ok: false, error: e?.message || 'Could not delete this slot.' }
  }
}
