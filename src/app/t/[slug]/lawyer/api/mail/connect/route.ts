import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { gmailAuthUrl, gmailConfigured } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!gmailConfigured()) return NextResponse.json({ error: 'Gmail is not configured.' }, { status: 400 })
  const state = `advocate:${slug}:${u.id}`
  return NextResponse.redirect(gmailAuthUrl(state, '/api/mail/callback'))
}
