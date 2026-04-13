import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteStoredFile, uploadFile } from '@/lib/storage'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string || ''

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const uploaded = await uploadFile({
      file,
      prefix: `uploads/cases/${id}`,
      localDirectory: `public/uploads/cases/${id}`,
      publicUrlPrefix: `/uploads/cases/${id}`,
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    })

    const doc = await prisma.caseDocument.create({
      data: {
        caseId: id,
        name: name || file.name,
        fileUrl: uploaded.url,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
      },
    })

    revalidatePath(`/admin/cases/${id}`)
    revalidatePath('/admin/cases')
    revalidatePath(`/lawyer/cases/${id}`)
    revalidatePath('/lawyer/cases')

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
    const doc = await prisma.caseDocument.findUnique({ where: { id: docId } })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    await deleteStoredFile(doc.fileUrl)
    await prisma.caseDocument.delete({ where: { id: docId } })
    if (doc.caseId) {
      const caseData = await prisma.courtCase.findUnique({ where: { id: doc.caseId }, select: { photoUrl: true } })
      if (caseData?.photoUrl && caseData.photoUrl === doc.fileUrl) {
        await prisma.courtCase.update({ where: { id: doc.caseId }, data: { photoUrl: null } })
      }
      revalidatePath(`/admin/cases/${doc.caseId}`)
      revalidatePath('/admin/cases')
      revalidatePath(`/lawyer/cases/${doc.caseId}`)
      revalidatePath('/lawyer/cases')
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
