import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disconnectZoom } from '@/lib/meeting-providers'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await disconnectZoom()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to disconnect Zoom:', err)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
