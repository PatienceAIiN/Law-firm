import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/cases/[id]/notes - Add case note
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

    if (!data.content || !data.advocateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify case exists
    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
    })

    if (!courtCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const note = await prisma.caseNote.create({
      data: {
        caseId: id,
        advocateId: data.advocateId,
        content: data.content,
        isPrivate: data.isPrivate || false,
      },
      include: {
        advocate: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    console.error('Note POST error:', error)
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    )
  }
}

// GET /api/cases/[id]/notes - List notes
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
    const notes = await prisma.caseNote.findMany({
      where: { caseId: id },
      include: {
        advocate: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notes)
  } catch (error: any) {
    console.error('Notes GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}
