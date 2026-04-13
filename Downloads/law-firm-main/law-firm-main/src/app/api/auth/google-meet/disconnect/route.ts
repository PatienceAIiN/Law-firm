import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disconnectGoogle } from '@/lib/meeting-providers'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await disconnectGoogle()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to disconnect Google:', err)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
