import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeAndStore } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  if (!code) {
    return NextResponse.redirect(`${base}/admin/mail?error=missing_code`)
  }
  try {
    await exchangeCodeAndStore(code)
    return NextResponse.redirect(`${base}/admin/mail?connected=1`)
  } catch (err: any) {
    return NextResponse.redirect(`${base}/admin/mail?error=${encodeURIComponent(err?.message || 'connect_failed')}`)
  }
}
