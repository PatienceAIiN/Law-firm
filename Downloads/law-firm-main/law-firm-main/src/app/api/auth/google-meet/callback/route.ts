import { NextRequest, NextResponse } from 'next/server'
import { saveGoogleTokens } from '@/lib/meeting-providers'

export async function GET(request: NextRequest) {
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
