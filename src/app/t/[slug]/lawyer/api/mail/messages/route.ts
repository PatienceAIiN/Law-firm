import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { listMessages } from '@/lib/gmail'
import { tenantGmailLawyerKey } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  try {
    const items = await listMessages(
      { labelId: url.searchParams.get('labelId') || 'INBOX', q: url.searchParams.get('q') || undefined },
      tenantGmailLawyerKey(u.tenantId, u.id),
    )
    return NextResponse.json({ items })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (/not connected|invalid_grant|no_account/i.test(msg)) return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 400 })
    return NextResponse.json({ error: msg || 'Failed' }, { status: 500 })
  }
}
