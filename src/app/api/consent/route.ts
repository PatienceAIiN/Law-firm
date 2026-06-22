import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fingerprint, consentGiven, purposes } = body

    if (!fingerprint) {
      return NextResponse.json({ error: 'Missing fingerprint' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
    const ua = req.headers.get('user-agent') || null

    const consent = await prisma.dpdpConsent.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        consentGiven: !!consentGiven,
        purposes: purposes ? JSON.stringify(purposes) : null,
        ipAddress: ip,
        userAgent: ua,
      },
      update: {
        consentGiven: !!consentGiven,
        purposes: purposes ? JSON.stringify(purposes) : null,
        revokedAt: consentGiven ? null : new Date(),
        ipAddress: ip,
        userAgent: ua,
      },
    })

    return NextResponse.json({ ok: true, id: consent.id })
  } catch (error: any) {
    console.error('DPDP consent error:', error)
    return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 })
  }
}

// Check consent status
export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fp')
  if (!fp) return NextResponse.json({ consent: null })

  const consent = await prisma.dpdpConsent.findUnique({
    where: { fingerprint: fp },
  })

  return NextResponse.json({ consent })
}
