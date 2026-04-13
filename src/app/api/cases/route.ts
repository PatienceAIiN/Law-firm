import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/cases - List all cases with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const searchQuery = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    interface WhereClause {
      status?: string
      OR?: Array<{
        [key: string]: {
          contains: string
          mode?: string
        }
      }>
    }

    const where: WhereClause = {}

    if (status) {
      where.status = status
    }

    if (searchQuery) {
      where.OR = [
        { caseNumber: { contains: searchQuery, mode: 'insensitive' } },
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { clientName: { contains: searchQuery, mode: 'insensitive' } },
        { court: { contains: searchQuery, mode: 'insensitive' } },
      ]
    }

    const [cases, total] = await Promise.all([
      prisma.courtCase.findMany({
        where,
        include: {
          advocate: {
            select: { id: true, name: true, email: true },
          },
          documents: { select: { id: true, name: true } },
          payments: { select: { id: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.courtCase.count({ where }),
    ])

    return NextResponse.json({
      cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Cases GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    )
  }
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.caseNumber || !data.title || !data.clientName || !data.clientEmail || !data.court) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if case number already exists
    const existingCase = await prisma.courtCase.findFirst({
      where: { caseNumber: data.caseNumber },
    })

    if (existingCase) {
      return NextResponse.json(
        { error: 'Case number already exists' },
        { status: 400 }
      )
    }

    const newCase = await prisma.courtCase.create({
      data: {
        caseNumber: data.caseNumber,
        title: data.title,
        caseType: data.caseType || 'Civil',
        status: data.status || 'ACTIVE',
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
        emailControl: data.emailControl || 'NONE',
        sendReminder: data.sendReminder !== false,
      },
      include: {
        advocate: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(newCase, { status: 201 })
  } catch (error: any) {
    console.error('Cases POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    )
  }
}
