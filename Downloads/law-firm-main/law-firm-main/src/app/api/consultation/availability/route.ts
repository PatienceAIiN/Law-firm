import { NextRequest, NextResponse } from 'next/server'
import { getAvailabilityForDate } from '@/lib/consultation-scheduling'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const meetingMode = searchParams.get('meetingMode')

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 })
  }

  const availability = await getAvailabilityForDate(
    date,
    meetingMode === 'PHYSICAL' || meetingMode === 'GOOGLE_MEET' || meetingMode === 'ZOOM'
      ? meetingMode
      : undefined
  )
  return NextResponse.json(availability)
}
