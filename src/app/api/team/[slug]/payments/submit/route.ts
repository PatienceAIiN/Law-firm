import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/upload'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
  if (!tenant) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  const form = await req.formData()
  const receiptId = String(form.get('receiptId') || '')
  const transactionNumber = String(form.get('transactionNumber') || '').trim()
  const file = form.get('screenshot')
  if (!receiptId || !transactionNumber) return NextResponse.json({ error: 'receiptId and transactionNumber are required' }, { status: 400 })
  const receipt = await prisma.receipt.findFirst({ where: { id: receiptId, tenantId: tenant.id } })
  if (!receipt) return NextResponse.json({ error: 'Receipt not found in this workspace' }, { status: 404 })
  let screenshotUrl: string | undefined
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return NextResponse.json({ error: 'Upload an image or PDF proof file' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Proof file must be 10 MB or less' }, { status: 400 })
    screenshotUrl = await uploadFile(file)
  }
  const payment = await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      receiptId: receipt.id,
      advocateId: receipt.advocateId,
      amount: receipt.total,
      currency: receipt.currency,
      method: receipt.paymentMethod || 'OTHER',
      status: 'RECEIVED',
      payerName: receipt.clientName,
      payerEmail: receipt.clientEmail,
      transactionNumber,
      screenshotUrl,
      verificationRequired: true,
      notes: 'Client submitted payment proof; verification required.',
    } as any,
  })
  await prisma.paymentLog.create({ data: { paymentId: payment.id, tenantId: tenant.id, actorType: 'CLIENT', actorName: receipt.clientName, action: 'CLIENT_SUBMITTED_PROOF', toStatus: 'RECEIVED', details: JSON.stringify({ receiptId: receipt.id, transactionNumber, screenshotUrl }) } as any }).catch(() => null)
  return NextResponse.redirect(new URL(`/team/${slug}/payment-done/${receipt.id}?submitted=1`, req.url), { status: 303 })
}
