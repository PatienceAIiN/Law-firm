import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export const dynamic = 'force-dynamic'

// Issues a short-lived LiveKit access token for a meeting room.
export async function POST(req: NextRequest) {
  let body: { room?: string; identity?: string; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { room, identity, name } = body
  if (!room || !identity) {
    return NextResponse.json({ error: 'room and identity are required' }, { status: 400 })
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!apiKey || !apiSecret || !url) {
    return NextResponse.json(
      { error: 'Video service is not configured. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET and NEXT_PUBLIC_LIVEKIT_URL.' },
      { status: 500 },
    )
  }

  const at = new AccessToken(apiKey, apiSecret, { identity, name: name || identity, ttl: '4h' })
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  const token = await at.toJwt()
  return NextResponse.json({ token, url })
}
