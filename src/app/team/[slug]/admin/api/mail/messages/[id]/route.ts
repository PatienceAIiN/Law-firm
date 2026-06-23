import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getMessage, markRead, trashMessage } from '@/lib/gmail'
import { tenantGmailAdminKey } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

async function authed(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return null
  return { key: tenantGmailAdminKey(u.tenantId) }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const auth = await authed(slug); if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const m = await getMessage(id, auth.key)
    await markRead(id, auth.key).catch(() => {})
    return NextResponse.json(m)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const auth = await authed(slug); if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { await trashMessage(id, auth.key); return NextResponse.json({ ok: true }) }
  catch (e: any) { return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 }) }
}
