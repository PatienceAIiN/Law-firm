import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logCaseActivity } from '@/lib/case-activity'

// GET /api/cases/[id] - Get case details
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
    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
      include: {
        advocate: {
          select: { id: true, name: true, email: true, phone: true },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        notes: {
          include: {
            advocate: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!courtCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json(courtCase)
  } catch (error: any) {
    console.error('Case GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    )
  }
}

// PUT /api/cases/[id] - Update case
export async function PUT(
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

    const courtCase = await prisma.courtCase.update({
      where: { id },
      data: {
        title: data.title,
        caseType: data.caseType,
        status: data.status,
        court: data.court,
        judge: data.judge,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        opposingParty: data.opposingParty,
        advocateId: data.advocateId,
        filingDate: data.filingDate ? new Date(data.filingDate) : null,
        nextHearingDate: data.nextHearingDate ? new Date(data.nextHearingDate) : null,
        courtAppearanceDate: data.courtAppearanceDate ? new Date(data.courtAppearanceDate) : null,
        description: data.description,
        emailControl: data.emailControl,
        sendReminder: data.sendReminder,
      },
      include: {
        advocate: {
          select: { id: true, name: true, email: true },
        },
        documents: true,
        payments: true,
      },
    })

    await logCaseActivity({
      caseId: id,
      actorType: 'ADMIN',
      actorName: (session.user as any)?.name || 'Admin',
      action: 'CASE_EDITED',
      details: 'Case updated from admin panel',
    })

    return NextResponse.json(courtCase)
  } catch (error: any) {
    console.error('Case PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    )
  }
}

// DELETE /api/cases/[id] - Delete case
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Delete related documents and payments first (cascade handled by Prisma)
    await prisma.courtCase.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Case DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete case' },
      { status: 500 }
    )
  }
}
