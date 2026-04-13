import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveGoogleTokens } from '@/lib/meeting-providers'

export async function GET(request: NextRequest) {
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
