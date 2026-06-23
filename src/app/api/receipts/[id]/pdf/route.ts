import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPortalUser, parseItems } from '@/lib/receipts'
import { generateReceiptPdf } from '@/lib/receipt-pdf'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getPortalUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const receipt = await prisma.receipt.findUnique({ where: { id } })
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isAdmin && receipt.advocateId !== user.advocateId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const pdf = await generateReceiptPdf({ ...receipt, items: parseItems(receipt.items) })
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${receipt.number}.pdf"`,
    },
  })
}
