import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { gmailConfigured, getConnectedEmail, gmailOAuthBaseUrl, gmailRedirectUri } from '@/lib/gmail'
import { tenantGmailAdminKey } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const email = await getConnectedEmail(tenantGmailAdminKey(u.tenantId))
  const base = gmailOAuthBaseUrl(req)
  return NextResponse.json({ configured: gmailConfigured(), connected: Boolean(email), email, redirectUri: gmailRedirectUri('/api/mail/callback', base) })
}
