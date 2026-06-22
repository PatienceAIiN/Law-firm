import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { gmailConfigured, getConnectedEmail, advocateMailKey } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(advocateAuthOptions)
  const id = session?.user?.id
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const email = await getConnectedEmail(advocateMailKey(id))
  return NextResponse.json({ configured: gmailConfigured(), connected: Boolean(email), email })
}
