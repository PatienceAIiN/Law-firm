import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/cases/[id]/payments - Add payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id } = await params

    if (!data.amount || !data.mode || !data.paymentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify case exists
    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
    })

    if (!courtCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const payment = await prisma.casePayment.create({
      data: {
        caseId: id,
        amount: parseFloat(data.amount),
        currency: data.currency || 'INR',
        mode: data.mode,
        reference: data.reference,
        description: data.description,
        paymentDate: new Date(data.paymentDate),
        receiptSent: false,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('Payment POST error:', error)
    return NextResponse.json(
      { error: 'Failed to add payment' },
      { status: 500 }
    )
  }
}

// GET /api/cases/[id]/payments - List payments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const payments = await prisma.casePayment.findMany({
      where: { caseId: id },
      orderBy: { paymentDate: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Payments GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
