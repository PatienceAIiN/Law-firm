import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteStoredFile } from '@/lib/storage'
import { revalidatePath } from 'next/cache'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { uploadedAt: 'desc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })
    if (!courtCase) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(courtCase)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: any = {}
    const fields = [
      'caseNumber', 'title', 'caseType', 'status', 'court', 'judge',
      'clientName', 'clientEmail', 'clientPhone', 'opposingParty',
      'advocateId', 'description', 'emailControl', 'photoUrl', 'sendReminder',
    ]
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f] || null
    }
    if (body.filingDate !== undefined) data.filingDate = body.filingDate ? new Date(body.filingDate) : null
    if (body.nextHearingDate !== undefined) data.nextHearingDate = body.nextHearingDate ? new Date(body.nextHearingDate) : null
    if (body.courtAppearanceDate !== undefined) data.courtAppearanceDate = body.courtAppearanceDate ? new Date(body.courtAppearanceDate) : null
    if (body.sendReminder !== undefined) data.sendReminder = Boolean(body.sendReminder)

    const updated = await prisma.courtCase.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update case' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
      include: { documents: true },
    })
    if (!courtCase) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await Promise.all([
      ...(courtCase.documents || []).map((doc) => deleteStoredFile(doc.fileUrl)),
      deleteStoredFile(courtCase.photoUrl),
    ])
    await prisma.courtCase.delete({ where: { id } })
    revalidatePath('/admin/cases')
    revalidatePath('/lawyer/cases')
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
  }
}
