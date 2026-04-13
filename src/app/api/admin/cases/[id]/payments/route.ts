import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { amount, mode, reference, description, paymentDate } = body

    if (!amount || !mode || !paymentDate) {
      return NextResponse.json({ error: 'amount, mode and paymentDate are required' }, { status: 400 })
    }

    const payment = await prisma.casePayment.create({
      data: {
        caseId: id,
        amount: parseFloat(amount),
        mode,
        reference: reference || null,
        description: description || null,
        paymentDate: new Date(paymentDate),
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add payment' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    await prisma.casePayment.delete({ where: { id: paymentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
