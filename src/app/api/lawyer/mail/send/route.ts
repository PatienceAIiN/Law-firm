import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { sendMessage, advocateMailKey } from '@/lib/gmail'
import { validateAttachments } from '@/lib/mail-attachments'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(advocateAuthOptions)
  const adv = session?.user?.id
  if (!adv) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!body.to || !body.subject) return NextResponse.json({ error: 'Recipient and subject required' }, { status: 400 })
  const att = validateAttachments(body.attachments)
  if (att.error) return NextResponse.json({ error: att.error }, { status: 400 })
  try { await sendMessage({ to: body.to, subject: body.subject, body: body.body || '', attachments: att.attachments }, advocateMailKey(adv)); return NextResponse.json({ success: true }) }
  catch (e: any) {
    if (String(e?.message).includes('GMAIL_NOT_CONNECTED')) return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 409 })
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
