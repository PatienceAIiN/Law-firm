import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface ActivityEvent {
  id: string
  bookingId: string
  type: string
  details: string
  ip?: string
  userAgent?: string
  timestamp: string
  adminNotified?: boolean
}

async function getLog(): Promise<ActivityEvent[]> {
  const s = await prisma.siteSetting.findUnique({ where: { key: 'meeting_activity_log' } })
  if (!s) return []
  try { return JSON.parse(s.value) } catch { return [] }
}

async function appendEvent(event: ActivityEvent) {
  const existing = await getLog()
  const updated = [event, ...existing].slice(0, 500) // keep last 500
  await prisma.siteSetting.upsert({
    where: { key: 'meeting_activity_log' },
    update: { value: JSON.stringify(updated) },
    create: { key: 'meeting_activity_log', value: JSON.stringify(updated) },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId, type, details } = await req.json()
    if (!bookingId || !type) return NextResponse.json({ error: 'bookingId and type required' }, { status: 400 })

    const event: ActivityEvent = {
      id: crypto.randomUUID(),
      bookingId,
      type,
      details: details || '',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || '',
      timestamp: new Date().toISOString(),
    }
    await appendEvent(event)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get('bookingId')
  const all = await getLog()
  return NextResponse.json({ events: bookingId ? all.filter(e => e.bookingId === bookingId) : all })
}

export async function DELETE() {
  await prisma.siteSetting.deleteMany({ where: { key: 'meeting_activity_log' } })
  return NextResponse.json({ success: true })
}
