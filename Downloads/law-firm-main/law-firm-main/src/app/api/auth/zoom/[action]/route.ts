import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disconnectZoom, exchangeZoomCode, getZoomOAuthUrl, saveZoomTokens } from '@/lib/meeting-providers'

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

    if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL('/admin/integrations?error=zoom_not_configured', request.url)
      )
    }

    const baseUrl = new URL(request.url).origin
    const url = getZoomOAuthUrl(baseUrl)
    return NextResponse.redirect(url)
  }

  if (action === 'callback') {
    const { searchParams } = request.nextUrl
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
      return NextResponse.redirect(
        new URL('/admin/integrations?error=zoom_denied', request.url)
      )
    }

    try {
      const baseUrl = new URL(request.url).origin
      const tokens = await exchangeZoomCode(code, baseUrl)

      if (tokens.error) {
        console.error('Zoom OAuth token exchange error:', tokens)
        return NextResponse.redirect(
          new URL('/admin/integrations?error=zoom_token_exchange', request.url)
        )
      }

      await saveZoomTokens({
        ...tokens,
        expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      })

      return NextResponse.redirect(
        new URL('/admin/integrations?connected=zoom', request.url)
      )
    } catch (err) {
      console.error('Zoom OAuth callback error:', err)
      return NextResponse.redirect(
        new URL('/admin/integrations?error=zoom_failed', request.url)
      )
    }
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
    await disconnectZoom()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to disconnect Zoom:', err)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
