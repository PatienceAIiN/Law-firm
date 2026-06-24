import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { gmailConfigured, getConnectedEmail, gmailOAuthBaseUrl, gmailRedirectUri } from '@/lib/gmail'
import { tenantGmailLawyerKey } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const email = await getConnectedEmail(tenantGmailLawyerKey(u.tenantId, u.id))
  const base = gmailOAuthBaseUrl(req)
  return NextResponse.json({ configured: gmailConfigured(), connected: Boolean(email), email, redirectUri: gmailRedirectUri('/api/mail/callback', base) })
}
