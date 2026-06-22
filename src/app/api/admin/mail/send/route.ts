import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendMessage } from '@/lib/gmail'
import { validateAttachments } from '@/lib/mail-attachments'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { to?: string; subject?: string; body?: string; attachments?: any[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (!body.to || !body.subject) {
    return NextResponse.json({ error: 'Recipient and subject are required' }, { status: 400 })
  }
  const att = validateAttachments(body.attachments)
  if (att.error) return NextResponse.json({ error: att.error }, { status: 400 })
  try {
    await sendMessage({ to: body.to, subject: body.subject, body: body.body || '', attachments: att.attachments })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (String(err?.message).includes('GMAIL_NOT_CONNECTED')) {
      return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 409 })
    }
    return NextResponse.json({ error: err?.message || 'Failed to send' }, { status: 500 })
  }
}
