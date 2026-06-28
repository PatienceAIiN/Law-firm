import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Returns unread / awaiting counts scoped to the authenticated user.
// One endpoint, two paths (admin OR lawyer cookie) — whichever session
// is present wins. Tenant-isolated by tenantId on every query.
export async function GET() {
  const admin = await getServerSession(tenantAdminAuthOptions)
  const lawyer = admin ? null : await getServerSession(tenantLawyerAuthOptions)
  const u: any = (admin || lawyer)?.user
  if (!u?.id) return NextResponse.json({ ok: false }, { status: 401 })

  const tenantId = u.tenantId as string
  const isLawyer = !admin

  const out: Record<string, any> = { inquiries: 0, receipts: 0, payments: 0, mail: 0 }
  // Latest item timestamps per category — the client compares these with
  // the per-route lastSeen marker in localStorage and shows the chip only
  // when there's something genuinely newer than the last visit.
  out.latest = { inquiries: null as string | null, payments: null as string | null }

  // Chips are personal: each user sees only the counts for items THEY
  // raised. Lawyers count their own (advocateId = u.id). Admins count only
  // firm-level items (advocateId is null) — anything a lawyer raised shows
  // up in that lawyer's chip, never bleeds into other people's nav bar.
  const ownership = isLawyer ? { advocateId: u.id } : { advocateId: null }

  try {
    out.inquiries = await prisma.contactSubmission.count({
      where: { tenantId, status: 'NEW', ...ownership } as any,
    })
    const latestInquiry = await prisma.contactSubmission.findFirst({
      where: { tenantId, status: 'NEW', ...ownership } as any,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    out.latest.inquiries = latestInquiry?.createdAt?.toISOString() || null
  } catch {}

  // Chip ONLY reflects items RECEIVED from clients — payments submitted
  // and awaiting admin/lawyer review. Self-created drafts/issued receipts
  // do not count toward the badge.
  try {
    out.payments = await (prisma as any).payment.count({
      where: { tenantId, status: 'AWAITING_REVIEW', ...ownership },
    })
    const latestPayment = await (prisma as any).payment.findFirst({
      where: { tenantId, status: 'AWAITING_REVIEW', ...ownership },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    out.latest.payments = latestPayment?.createdAt?.toISOString() || null
  } catch {}
  out.receipts = 0

  return NextResponse.json(out)
}
