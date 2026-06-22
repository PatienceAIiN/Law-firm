import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { getMessage, markRead, trashMessage, advocateMailKey } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const adv = session?.user?.id
  if (!adv) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const msg = await getMessage(id, advocateMailKey(adv))
    await markRead(id, advocateMailKey(adv)).catch(() => {})
    return NextResponse.json(msg)
  } catch (e: any) { return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const adv = session?.user?.id
  if (!adv) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try { await trashMessage(id, advocateMailKey(adv)); return NextResponse.json({ success: true }) }
  catch (e: any) { return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 }) }
}
