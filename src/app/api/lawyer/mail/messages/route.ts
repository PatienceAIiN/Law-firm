import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { listMessages, advocateMailKey } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(advocateAuthOptions)
  const id = session?.user?.id
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sp = new URL(req.url).searchParams
  try {
    const data = await listMessages({ q: sp.get('q') || undefined, labelId: sp.get('labelId') || undefined, pageToken: sp.get('pageToken') || undefined }, advocateMailKey(id))
    return NextResponse.json(data)
  } catch (e: any) {
    if (String(e?.message).includes('GMAIL_NOT_CONNECTED')) return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 409 })
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
