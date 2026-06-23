import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gmailAuthUrl, gmailConfigured } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!gmailConfigured()) {
    return NextResponse.json({ error: 'Gmail is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' }, { status: 400 })
  }
  const url = new URL(req.url)
  const baseUrl = `${url.protocol}//${url.host}`
  return NextResponse.redirect(gmailAuthUrl('superadmin', '/api/mail/callback', baseUrl))
}
