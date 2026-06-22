import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listMessages } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || undefined
  const labelId = searchParams.get('labelId') || undefined
  const pageToken = searchParams.get('pageToken') || undefined

  try {
    const data = await listMessages({ q, labelId, pageToken })
    return NextResponse.json(data)
  } catch (err: any) {
    if (String(err?.message).includes('GMAIL_NOT_CONNECTED')) {
      return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 409 })
    }
    return NextResponse.json({ error: err?.message || 'Failed to list messages' }, { status: 500 })
  }
}
