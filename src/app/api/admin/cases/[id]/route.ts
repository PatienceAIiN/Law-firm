import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'

// Cases are tenant-private. Every handler requires a tenant-admin session
// and only touches cases belonging to that admin's tenant.
async function requireAdmin() {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  return u?.tenantId ? { tenantId: u.tenantId as string } : null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const courtCase = await prisma.courtCase.findFirst({
      where: { id, tenantId: admin.tenantId },
      include: {
        documents: { orderBy: { uploadedAt: 'desc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })
    if (!courtCase) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(courtCase)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const owned = await prisma.courtCase.findFirst({ where: { id, tenantId: admin.tenantId }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json()

    const data: any = {}
    const fields = [
      'caseNumber', 'title', 'caseType', 'status', 'court', 'judge',
      'clientName', 'clientEmail', 'clientPhone', 'opposingParty',
      'advocateId', 'description', 'emailControl', 'photoUrl', 'sendReminder',
    ]
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f] || null
    }
    if (body.filingDate !== undefined) data.filingDate = body.filingDate ? new Date(body.filingDate) : null
    if (body.nextHearingDate !== undefined) data.nextHearingDate = body.nextHearingDate ? new Date(body.nextHearingDate) : null
    if (body.courtAppearanceDate !== undefined) data.courtAppearanceDate = body.courtAppearanceDate ? new Date(body.courtAppearanceDate) : null
    if (body.sendReminder !== undefined) data.sendReminder = Boolean(body.sendReminder)

    const updated = await prisma.courtCase.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update case' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const owned = await prisma.courtCase.findFirst({ where: { id, tenantId: admin.tenantId }, select: { id: true } })
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.courtCase.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
  }
}
