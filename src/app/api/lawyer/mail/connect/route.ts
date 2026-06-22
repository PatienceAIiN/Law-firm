import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { gmailAuthUrl, gmailConfigured } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(advocateAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!gmailConfigured()) return NextResponse.json({ error: 'Gmail is not configured (GOOGLE_CLIENT_ID/SECRET).' }, { status: 400 })
  return NextResponse.redirect(gmailAuthUrl('lawyer', '/api/lawyer/mail/callback'))
}
