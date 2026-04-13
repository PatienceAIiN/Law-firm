import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGoogleOAuthUrl } from '@/lib/meeting-providers'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL('/admin/integrations?error=google_not_configured', request.url)
    )
  }

  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin
  const url = getGoogleOAuthUrl(baseUrl)
  return NextResponse.redirect(url)
}
