import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gmailConfigured, getConnectedEmail, gmailOAuthBaseUrl, gmailRedirectUri } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const email = await getConnectedEmail()
  const base = gmailOAuthBaseUrl(req)
  return NextResponse.json({ configured: gmailConfigured(), connected: Boolean(email), email, redirectUri: gmailRedirectUri('/api/mail/callback', base) })
}
