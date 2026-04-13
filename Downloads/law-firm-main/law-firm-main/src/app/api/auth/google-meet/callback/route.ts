import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleCode, saveGoogleTokens } from '@/lib/meeting-providers'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/admin/integrations?error=google_denied`, request.url)
    )
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin
    const tokens = await exchangeGoogleCode(code, baseUrl)

    if (tokens.error) {
      console.error('Google OAuth token exchange error:', tokens)
      return NextResponse.redirect(
        new URL('/admin/integrations?error=google_token_exchange', request.url)
      )
    }

    await saveGoogleTokens({
      ...tokens,
      expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    })

    return NextResponse.redirect(
      new URL('/admin/integrations?connected=google', request.url)
    )
  } catch (err) {
    console.error('Google Meet OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/admin/integrations?error=google_failed', request.url)
    )
  }
}
