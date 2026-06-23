import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { listMessages } from '@/lib/gmail'
import { tenantGmailAdminKey } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const labelId = url.searchParams.get('labelId') || 'INBOX'
  const q = url.searchParams.get('q') || undefined
  try {
    const items = await listMessages({ labelId, q }, tenantGmailAdminKey(u.tenantId))
    return NextResponse.json({ items })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (/not connected|invalid_grant|no_account/i.test(msg)) {
      return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 400 })
    }
    return NextResponse.json({ error: msg || 'Failed to list mail' }, { status: 500 })
  }
}
