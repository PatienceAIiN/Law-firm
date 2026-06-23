import { NextRequest, NextResponse } from 'next/server'
import { decode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const COOKIE_NAME = 'tenant-admin-session-token'

/**
 * Auto-login: if the user has a valid tenant-admin session cookie,
 * decode it and redirect them straight to their workspace.
 * Called by the frontend when localStorage has a remembered email.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email || '').toString().trim().toLowerCase()
  if (!email) return NextResponse.json({ ok: false })

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return NextResponse.json({ ok: false })

  const raw = req.cookies.get(COOKIE_NAME)?.value
  if (!raw) return NextResponse.json({ ok: false })

  try {
    const token = await decode({ token: raw, secret })
    if (!token || token.email !== email) return NextResponse.json({ ok: false })

    const slug = token.tenantSlug as string | undefined
    if (!slug) return NextResponse.json({ ok: false })

    // Verify tenant still active
    const tenant = await prisma.tenant.findUnique({ where: { slug } })
    if (!tenant || tenant.status !== 'active') return NextResponse.json({ ok: false })

    return NextResponse.json({ ok: true, slug })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
