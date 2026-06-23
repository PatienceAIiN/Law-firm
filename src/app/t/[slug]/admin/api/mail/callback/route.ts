import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { exchangeCodeAndStore } from '@/lib/gmail'
import { tenantGmailAdminKey } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  const code = new URL(req.url).searchParams.get('code')
  if (!u?.id || u.tenantSlug !== slug || !code) {
    return NextResponse.redirect(`${base}/t/${slug}/admin?mail=error`)
  }
  try {
    await exchangeCodeAndStore(code, tenantGmailAdminKey(u.tenantId), `/t/${slug}/admin/api/mail/callback`)
    return NextResponse.redirect(`${base}/t/${slug}/admin/mail?connected=true`)
  } catch (e: any) {
    return NextResponse.redirect(`${base}/t/${slug}/admin?mail=error`)
  }
}
