import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const COOKIE_NAME = 'tenant-admin-session-token'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email || '').toString().trim().toLowerCase()
  const code = (body.code || '').toString().replace(/\D/g, '')
  const slug = (body.slug || '').toString().trim().toLowerCase()
  if (!email || code.length !== 6) return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 })

  const row = await prisma.workspaceOpenOtp.findFirst({
    where: { email, verified: false },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) return NextResponse.json({ error: 'No pending code. Request a new one.' }, { status: 400 })
  if (row.expiresAt < new Date()) return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  if (row.attempts >= 5) return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 400 })
  if (row.otp !== code) {
    await prisma.workspaceOpenOtp.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } })
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 })
  }

  const adminUsers = await prisma.adminUser.findMany({
    where: { email, tenant: { status: 'active' } },
    select: { id: true, role: true, tenant: { select: { id: true, slug: true, name: true } } },
  })
  if (adminUsers.length === 0) return NextResponse.json({ error: 'No active workspace for this email.' }, { status: 404 })

  // If multiple workspaces share this email and the caller didn't pick one, ask
  // them to choose; mark OTP verified so they can come back to pick without
  // re-entering the code.
  if (adminUsers.length > 1 && !slug) {
    await prisma.workspaceOpenOtp.update({ where: { id: row.id }, data: { verified: true } })
    return NextResponse.json({
      ok: true,
      requiresPick: true,
      workspaces: adminUsers.map((u) => ({ slug: u.tenant.slug, name: u.tenant.name })),
    })
  }

  const target = slug ? adminUsers.find((u) => u.tenant.slug === slug) : adminUsers[0]
  if (!target) return NextResponse.json({ error: 'Workspace mismatch.' }, { status: 400 })

  // Encode a NextAuth tenant-admin JWT for this user and set the cookie. After
  // this the user is logged into /t/<slug>/admin without ever typing a password.
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return NextResponse.json({ error: 'Server misconfigured (NEXTAUTH_SECRET missing).' }, { status: 500 })

  const token = await encode({
    token: {
      name: email,
      email,
      role: target.role,
      adminId: target.id,
      tenantId: target.tenant.id,
      tenantSlug: target.tenant.slug,
    },
    secret,
  })

  await prisma.workspaceOpenOtp.update({ where: { id: row.id }, data: { verified: true } })

  const res = NextResponse.json({ ok: true, slug: target.tenant.slug, name: target.tenant.name })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
