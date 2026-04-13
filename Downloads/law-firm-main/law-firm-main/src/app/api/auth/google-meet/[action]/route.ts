import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disconnectGoogle, saveGoogleTokens } from '@/lib/meeting-providers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params

  if (action === 'connect') {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    await saveGoogleTokens({
      provider: 'jitsi',
      connected: true,
      saved_at: new Date().toISOString(),
    })

    return NextResponse.redirect(new URL('/admin/integrations?connected=google', request.url))
  }

  if (action === 'callback') {
    const { searchParams } = request.nextUrl
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/admin/integrations?error=google_denied', request.url))
    }

    await saveGoogleTokens({
      provider: 'jitsi',
      connected: true,
      saved_at: new Date().toISOString(),
    })

    return NextResponse.redirect(new URL('/admin/integrations?connected=google', request.url))
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params
  if (action !== 'disconnect') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

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
