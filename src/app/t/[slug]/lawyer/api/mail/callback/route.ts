import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { exchangeCodeAndStore } from '@/lib/gmail'
import { tenantGmailLawyerKey } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  const code = new URL(req.url).searchParams.get('code')
  if (!u?.id || u.tenantSlug !== slug || !code) {
    return NextResponse.redirect(`${base}/t/${slug}/lawyer?mail=error`)
  }
  try {
    await exchangeCodeAndStore(code, tenantGmailLawyerKey(u.tenantId, u.id), `/t/${slug}/lawyer/api/mail/callback`)
    return NextResponse.redirect(`${base}/t/${slug}/lawyer/mail?connected=true`)
  } catch {
    return NextResponse.redirect(`${base}/t/${slug}/lawyer?mail=error`)
  }
}
