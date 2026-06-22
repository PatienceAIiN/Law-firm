import { NextRequest, NextResponse } from 'next/server'
import { listAvailabilityForMonth } from '@/lib/consultation-scheduling'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const meetingMode = searchParams.get('meetingMode')

  if (!month) {
    return NextResponse.json({ error: 'month is required' }, { status: 400 })
  }

  const availability = await listAvailabilityForMonth(
    month,
    meetingMode === 'PHYSICAL' || meetingMode === 'VIRTUAL'
      ? meetingMode
      : undefined
  )
  return NextResponse.json({ days: availability })
}
