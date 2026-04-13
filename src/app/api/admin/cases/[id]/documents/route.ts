import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string || ''

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cases', id)
    await mkdir(uploadDir, { recursive: true })

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(uploadDir, `${Date.now()}_${safeName}`)
    await writeFile(filePath, buffer)

    const relativePath = `/uploads/cases/${id}/${Date.now()}_${safeName}`

    const doc = await prisma.caseDocument.create({
      data: {
        caseId: id,
        name: name || file.name,
        fileUrl: `/uploads/cases/${id}/${path.basename(filePath)}`,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(req.url)
    const docId = searchParams.get('docId')
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 })
    await prisma.caseDocument.delete({ where: { id: docId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
