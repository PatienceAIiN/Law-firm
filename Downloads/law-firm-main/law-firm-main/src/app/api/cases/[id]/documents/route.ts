import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/cases/[id]/documents - Upload document
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

    if (!data.name || !data.fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify case exists
    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
    })

    if (!courtCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const document = await prisma.caseDocument.create({
      data: {
        caseId: id,
        name: data.name,
        fileUrl: data.fileUrl,
        fileType: data.fileType || 'application/pdf',
        fileSize: data.fileSize,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error('Document POST error:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}

// GET /api/cases/[id]/documents - List documents
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
    const documents = await prisma.caseDocument.findMany({
      where: { caseId: id },
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    console.error('Documents GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}
