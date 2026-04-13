import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteAvailabilitySlot, parseAllowedModes, updateAvailabilitySlot } from '@/lib/consultation-scheduling'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return Boolean(session)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slotId } = await params
  const body = await req.json()
  const slot = await updateAvailabilitySlot(slotId, {
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    capacity: body.capacity !== undefined ? Number(body.capacity) : undefined,
    allowedModes: body.allowedModes ? parseAllowedModes(Array.isArray(body.allowedModes) ? body.allowedModes.join(',') : body.allowedModes) : undefined,
    manualMeetingLink: body.manualMeetingLink,
    physicalAddress: body.physicalAddress,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
  })

  revalidatePath('/admin/availability')
  revalidatePath('/consultation')
  return NextResponse.json({ slot })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slotId } = await params
  await deleteAvailabilitySlot(slotId)
  revalidatePath('/admin/availability')
  revalidatePath('/consultation')
  return NextResponse.json({ success: true })
}
