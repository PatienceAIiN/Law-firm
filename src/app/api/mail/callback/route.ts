import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeAndStore } from '@/lib/gmail'
import { tenantGmailAdminKey } from '@/lib/tenant-settings'
import { advocateMailKey } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // Expected format: "type:slug:id"
  const base = `${url.protocol}//${url.host}`

  if (!code || !state) {
    return NextResponse.redirect(`${base}/?error=missing_auth_params`)
  }

  const parts = state.split(':')
  const type = parts[0]
  const slug = parts[1] || ''
  const id = parts[2] || ''

  try {
    if (type === 'superadmin') {
      await exchangeCodeAndStore(code, 'gmail_account', '/api/mail/callback', base)
      return NextResponse.redirect(`${base}/admin/mail?connected=1`)
    } 
    else if (type === 'tenantadmin') {
      if (!slug || !id) throw new Error('Invalid state parameters')
      await exchangeCodeAndStore(code, tenantGmailAdminKey(id), '/api/mail/callback', base)
      return NextResponse.redirect(`${base}/t/${slug}/admin/mail?connected=true`)
    } 
    else if (type === 'advocate') {
      if (!slug || !id) throw new Error('Invalid state parameters')
      await exchangeCodeAndStore(code, advocateMailKey(id), '/api/mail/callback', base)
      return NextResponse.redirect(`${base}/t/${slug}/lawyer/mail?connected=true`)
    } 
    else {
      throw new Error('Unknown authentication type')
    }
  } catch (err: any) {
    const fallbackPath = slug ? `/t/${slug}` : ''
    return NextResponse.redirect(`${base}${fallbackPath}?mail_error=${encodeURIComponent(err?.message || 'connect_failed')}`)
  }
}
