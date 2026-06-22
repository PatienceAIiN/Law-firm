import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const caseType = searchParams.get('caseType') || ''

    const cases = await prisma.courtCase.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { caseNumber: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { clientName: { contains: search, mode: 'insensitive' } },
              { court: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
          status ? { status } : {},
          caseType ? { caseType } : {},
        ]
      },
      include: {
        documents: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(cases)
  } catch (error) {
    console.error('GET /api/admin/cases error:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      caseNumber, title, caseType, status, court, judge,
      clientName, clientEmail, clientPhone, opposingParty,
      advocateId, filingDate, nextHearingDate, courtAppearanceDate,
      description, emailControl, sendReminder,
    } = body

    if (!caseNumber || !title || !clientName || !clientEmail || !court || !caseType) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    // Case numbers must be unique so a single number resolves one case (used by Track Case).
    const dupe = await prisma.courtCase.findFirst({ where: { caseNumber: { equals: caseNumber, mode: 'insensitive' } }, select: { id: true } })
    if (dupe) {
      return NextResponse.json({ error: 'A case with this case number already exists' }, { status: 409 })
    }

    const courtCase = await prisma.courtCase.create({
      data: {
        caseNumber,
        title,
        caseType,
        status: status || 'ACTIVE',
        court,
        judge: judge || null,
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        opposingParty: opposingParty || null,
        advocateId: advocateId || null,
        filingDate: filingDate ? new Date(filingDate) : null,
        nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
        courtAppearanceDate: courtAppearanceDate ? new Date(courtAppearanceDate) : null,
        description: description || null,
        emailControl: emailControl || 'NONE',
        sendReminder: sendReminder !== false,
      },
    })

    return NextResponse.json(courtCase, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/admin/cases error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create case' }, { status: 500 })
  }
}
