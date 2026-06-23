import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { gmailAuthUrl, gmailConfigured } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!gmailConfigured()) return NextResponse.json({ error: 'Gmail is not configured.' }, { status: 400 })
  // State carries tenant + role so the callback knows where to land.
  const state = `tenant-admin:${slug}`
  return NextResponse.redirect(gmailAuthUrl(state, `/t/${slug}/admin/api/mail/callback`))
}
