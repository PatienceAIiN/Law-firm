import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAvailabilitySlot, listAvailabilityForMonth, parseIstDate, parseAllowedModes } from '@/lib/consultation-scheduling'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return Boolean(session)
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 })
  }

  const days = await listAvailabilityForMonth(month)
  return NextResponse.json({ month, days })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  if (!body.date || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: 'date, startTime, and endTime are required' }, { status: 400 })
  }

  const slot = await createAvailabilitySlot({
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    capacity: Number(body.capacity || 1),
    allowedModes: parseAllowedModes(Array.isArray(body.allowedModes) ? body.allowedModes.join(',') : body.allowedModes),
    manualMeetingLink: body.manualMeetingLink || null,
    physicalAddress: body.physicalAddress || null
  })

  revalidatePath('/admin/availability')
  revalidatePath('/consultation')
  return NextResponse.json({ slot })
}
