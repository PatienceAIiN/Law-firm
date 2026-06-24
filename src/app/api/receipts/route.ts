import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPortalUser, computeTotals, nextReceiptNumber, emailReceipt } from '@/lib/receipts'

export const dynamic = 'force-dynamic'

// List receipt history. Advocates see their own; admins see all.
export async function GET() {
  const user = await getPortalUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Safe SELECT — skips the new `paymentMethod` column on schemas where
  // its migration hasn't been applied yet.
  const receipts = await prisma.receipt.findMany({
    where: user.isAdmin ? {} : { advocateId: user.advocateId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, number: true, clientName: true, clientEmail: true,
      advocateId: true, createdByName: true, items: true, currency: true,
      subtotal: true, taxRate: true, taxAmount: true, total: true,
      notes: true, status: true, sentAt: true, createdAt: true,
    },
  })
  return NextResponse.json({ receipts })
}

// Create a receipt; optionally email it immediately (send=true).
export async function POST(req: NextRequest) {
  const user = await getPortalUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { clientName, clientEmail, items = [], taxRate = 0, currency = 'INR', notes = '', send = false, paymentMethod = 'OTHER' } = body
  if (!clientName || !clientEmail || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Client name, email and at least one item are required' }, { status: 400 })
  }

  const allowed = ['UPI', 'NEFT', 'CASH', 'OTHER'] as const
  const pm = allowed.includes(String(paymentMethod).toUpperCase() as any)
    ? String(paymentMethod).toUpperCase()
    : 'OTHER'

  const totals = computeTotals(items, taxRate)
  const number = await nextReceiptNumber()

  const baseData = {
    number, clientName, clientEmail,
    advocateId: user.advocateId,
    createdByName: user.name,
    items: JSON.stringify(totals.items),
    currency, taxRate: Number(taxRate) || 0,
    subtotal: totals.subtotal, taxAmount: totals.taxAmount, total: totals.total,
    notes: notes || null,
    status: 'DRAFT',
  }
  let receipt
  try {
    receipt = await prisma.receipt.create({ data: { ...baseData, paymentMethod: pm } as any })
  } catch (e: any) {
    // Pre-migration fallback: retry without the new column.
    if (/paymentMethod/i.test(String(e?.message))) {
      receipt = await prisma.receipt.create({ data: baseData })
    } else throw e
  }

  let delivery: string | undefined
  if (send) {
    delivery = await emailReceipt(receipt)
    receipt = await prisma.receipt.update({ where: { id: receipt.id }, data: { status: 'SENT', sentAt: new Date() } })
  }

  return NextResponse.json({ receipt, delivery })
}
