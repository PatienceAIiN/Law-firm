import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeSlug } from '@/lib/tenant'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Resolves either a slug or a firm name → tenant slug. Used by the landing
// page's "Open workspace" widget so users don't need to know URL syntax.
export async function POST(req: NextRequest) {
  // Throttled — this resolves firm names to slugs and could be scraped
  // to enumerate every workspace on the platform.
  const rl = await rateLimit(`ws-lookup:${clientIp(req)}`, 30, 600)
  if (!rl.ok) return NextResponse.json({ error: 'Too many lookups. Try again shortly.' }, { status: 429 })
  const body = await req.json().catch(() => ({}))
  const raw = (body.q || '').toString().trim()
  if (!raw) return NextResponse.json({ error: 'Enter your firm name or workspace URL' }, { status: 400 })

  const candidates = [raw.toLowerCase(), normalizeSlug(raw)]
  for (const slug of candidates) {
    if (!slug) continue
    const t = await prisma.tenant.findUnique({ where: { slug } })
    if (t) return NextResponse.json({ slug: t.slug, name: t.name })
  }

  const byName = await prisma.tenant.findFirst({
    where: { name: { contains: raw, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
  })
  if (byName) return NextResponse.json({ slug: byName.slug, name: byName.name })

  return NextResponse.json({ error: 'No workspace matches that name. Did you sign up yet?' }, { status: 404 })
}
