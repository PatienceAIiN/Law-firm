import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { sendMessage } from '@/lib/gmail'
import { tenantGmailLawyerKey } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  try {
    const result = await sendMessage(
      { to: body.to, subject: body.subject, body: body.body, attachments: body.attachments },
      tenantGmailLawyerKey(u.tenantId, u.id),
    )
    return NextResponse.json({ ok: true, id: (result as any)?.id })
  } catch (e: any) { return NextResponse.json({ error: e?.message || 'Send failed' }, { status: 500 }) }
}
