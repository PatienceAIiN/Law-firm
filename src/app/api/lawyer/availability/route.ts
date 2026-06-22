import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import {
  listAvailabilityForMonth,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
} from '@/lib/consultation-scheduling'

export const dynamic = 'force-dynamic'

async function requireAdvocate() {
  const session = await getServerSession(advocateAuthOptions)
  return Boolean(session?.user?.id)
}

export async function GET(req: NextRequest) {
  if (!(await requireAdvocate())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const month = new URL(req.url).searchParams.get('month')
  if (!month) return NextResponse.json({ error: 'month is required' }, { status: 400 })
  const days = await listAvailabilityForMonth(month)
  return NextResponse.json({ month, days })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdvocate())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const { date, startTime, endTime, capacity = 1, allowedModes = ['VIRTUAL', 'PHYSICAL'] } = body
  if (!date || !startTime || !endTime) return NextResponse.json({ error: 'date, startTime and endTime are required' }, { status: 400 })
  try {
    const slot = await createAvailabilitySlot({ date, startTime, endTime, capacity: Number(capacity) || 1, allowedModes })
    return NextResponse.json({ success: true, slot })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not create slot' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdvocate())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const slotId = new URL(req.url).searchParams.get('slotId')
  if (!slotId) return NextResponse.json({ error: 'slotId is required' }, { status: 400 })
  await deleteAvailabilitySlot(slotId).catch(() => {})
  return NextResponse.json({ success: true })
}
