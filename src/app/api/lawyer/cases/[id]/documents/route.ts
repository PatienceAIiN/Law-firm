import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'
import { logCaseActivity } from '@/lib/case-activity'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB
const ALLOWED: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

async function ownCase(id: string, advocateId: string) {
  const c = await prisma.courtCase.findUnique({ where: { id }, select: { advocateId: true, advocate: { select: { name: true } } } })
  if (!c) return { error: 'Case not found', status: 404 as const }
  if (c.advocateId !== advocateId) return { error: 'Forbidden', status: 403 as const }
  return { advocateName: c.advocate?.name || 'Advocate' }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const own = await ownCase(id, advocateId)
  if ('error' in own) return NextResponse.json({ error: own.error }, { status: own.status })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED[ext]) {
    return NextResponse.json({ error: 'Only PDF, DOC, DOCX, XLS and XLSX files are allowed' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 20 MB limit' }, { status: 400 })
  }

  const dir = path.join(process.cwd(), 'public', 'uploads', 'cases')
  await mkdir(dir, { recursive: true })
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)
  const storedName = `${id}-${Date.now()}-${safe}`
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, storedName), bytes)

  const doc = await prisma.caseDocument.create({
    data: { caseId: id, name: file.name, fileUrl: storedName, fileType: ALLOWED[ext], fileSize: file.size },
  })
  await logCaseActivity({ caseId: id, actorType: 'ADVOCATE', actorName: own.advocateName, action: 'DOCUMENT_UPLOADED', details: `Uploaded ${file.name}` })

  return NextResponse.json({ success: true, document: { ...doc, uploadedAt: doc.uploadedAt.toISOString() } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const own = await ownCase(id, advocateId)
  if ('error' in own) return NextResponse.json({ error: own.error }, { status: own.status })
  const docs = await prisma.caseDocument.findMany({ where: { caseId: id }, orderBy: { uploadedAt: 'desc' } })
  return NextResponse.json({ documents: docs.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString() })) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(advocateAuthOptions)
  const advocateId = session?.user?.id
  if (!advocateId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const own = await ownCase(id, advocateId)
  if ('error' in own) return NextResponse.json({ error: own.error }, { status: own.status })

  const docId = new URL(req.url).searchParams.get('docId')
  if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 })
  const doc = await prisma.caseDocument.findUnique({ where: { id: docId } })
  if (doc && doc.caseId === id) {
    if (!doc.fileUrl.startsWith('http')) {
      await unlink(path.join(process.cwd(), 'public', 'uploads', 'cases', doc.fileUrl)).catch(() => {})
    }
    await prisma.caseDocument.delete({ where: { id: docId } })
  }
  return NextResponse.json({ success: true })
}
