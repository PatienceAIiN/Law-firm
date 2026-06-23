import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPortalUser, computeTotals } from '@/lib/receipts'

export const dynamic = 'force-dynamic'

async function authorized(id: string) {
  const user = await getPortalUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const receipt = await prisma.receipt.findUnique({ where: { id } })
  if (!receipt) return { error: 'Not found', status: 404 as const }
  if (!user.isAdmin && receipt.advocateId !== user.advocateId) return { error: 'Forbidden', status: 403 as const }
  return { user, receipt }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await authorized(id)
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status })
  return NextResponse.json({ receipt: a.receipt })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await authorized(id)
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const items = Array.isArray(body.items) ? body.items : JSON.parse(a.receipt.items)
  const taxRate = body.taxRate ?? a.receipt.taxRate
  const totals = computeTotals(items, taxRate)

  const receipt = await prisma.receipt.update({
    where: { id },
    data: {
      clientName: body.clientName ?? a.receipt.clientName,
      clientEmail: body.clientEmail ?? a.receipt.clientEmail,
      currency: body.currency ?? a.receipt.currency,
      notes: body.notes ?? a.receipt.notes,
      paymentMethod: body.paymentMethod
        ? (['UPI', 'NEFT', 'CASH', 'OTHER'].includes(String(body.paymentMethod).toUpperCase())
            ? String(body.paymentMethod).toUpperCase()
            : (a.receipt as any).paymentMethod || 'OTHER')
        : (a.receipt as any).paymentMethod || 'OTHER',
      taxRate: Number(taxRate) || 0,
      items: JSON.stringify(totals.items),
      subtotal: totals.subtotal, taxAmount: totals.taxAmount, total: totals.total,
    },
  })
  return NextResponse.json({ receipt })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await authorized(id)
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status })
  await prisma.receipt.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
