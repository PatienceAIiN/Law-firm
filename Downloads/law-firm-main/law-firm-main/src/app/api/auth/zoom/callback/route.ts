import { NextRequest, NextResponse } from 'next/server'
import { exchangeZoomCode, saveZoomTokens } from '@/lib/meeting-providers'

export async function GET(request: NextRequest) {
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
