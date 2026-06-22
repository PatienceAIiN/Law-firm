import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPortalUser, emailReceipt } from '@/lib/receipts'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getPortalUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let receipt = await prisma.receipt.findUnique({ where: { id } })
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isAdmin && receipt.advocateId !== user.advocateId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Allow overriding the recipient email at send time.
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.clientEmail && body.clientEmail !== receipt.clientEmail) {
      receipt = await prisma.receipt.update({ where: { id }, data: { clientEmail: body.clientEmail } })
    }
  } catch {}

  const delivery = await emailReceipt(receipt)
  await prisma.receipt.update({ where: { id }, data: { status: 'SENT', sentAt: new Date() } })
  return NextResponse.json({ success: true, delivery })
}
