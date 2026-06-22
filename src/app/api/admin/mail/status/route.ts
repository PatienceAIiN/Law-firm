import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gmailConfigured, getConnectedEmail } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const email = await getConnectedEmail()
  return NextResponse.json({ configured: gmailConfigured(), connected: Boolean(email), email })
}
