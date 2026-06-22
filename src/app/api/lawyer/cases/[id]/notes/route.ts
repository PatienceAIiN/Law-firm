import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'
import { logCaseActivity } from '@/lib/case-activity'

export const dynamic = 'force-dynamic'

// Add a note to a case the advocate is assigned to.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const courtCase = await prisma.courtCase.findUnique({ where: { id }, select: { advocateId: true, advocate: { select: { name: true } } } })
  if (!courtCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  if (courtCase.advocateId !== advocateId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { content?: string; isPrivate?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  if (!body.content?.trim()) return NextResponse.json({ error: 'Note content is required' }, { status: 400 })

  const note = await prisma.caseNote.create({
    data: { caseId: id, advocateId, content: body.content.trim(), isPrivate: Boolean(body.isPrivate) },
  })
  await logCaseActivity({
    caseId: id, actorType: 'ADVOCATE', actorName: courtCase.advocate?.name || 'Advocate',
    action: 'NOTE_ADDED', details: body.isPrivate ? 'Added a private note' : 'Added a note',
  })
  return NextResponse.json({ success: true, id: note.id })
}

// Delete a note the advocate authored.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const noteId = new URL(req.url).searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'noteId is required' }, { status: 400 })

  const note = await prisma.caseNote.findUnique({ where: { id: noteId }, select: { advocateId: true } })
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  if (note.advocateId !== advocateId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.caseNote.delete({ where: { id: noteId } })
  return NextResponse.json({ success: true })
}
