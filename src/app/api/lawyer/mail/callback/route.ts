import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { exchangeCodeAndStore, advocateMailKey } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  const session = await getServerSession(advocateAuthOptions)
  const id = session?.user?.id
  const code = new URL(req.url).searchParams.get('code')
  if (!id || !code) return NextResponse.redirect(`${base}/lawyer/dashboard?mail=error`)
  try {
    await exchangeCodeAndStore(code, advocateMailKey(id), '/api/lawyer/mail/callback')
    return NextResponse.redirect(`${base}/lawyer/dashboard?mail=connected`)
  } catch (e: any) {
    return NextResponse.redirect(`${base}/lawyer/dashboard?mail=error`)
  }
}
