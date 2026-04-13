import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { basename, extname, isAbsolute, join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { appendMeetingRecording, getMeetingConfig } from '@/lib/meeting-workspace'

function sanitizeFileName(name: string) {
  return basename(name).replace(/[^a-zA-Z0-9._-]/g, '-')
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file')
  const bookingId = (formData.get('bookingId') as string) || ''

  if (!(file instanceof File) || !bookingId) {
    return NextResponse.json({ error: 'File and bookingId are required' }, { status: 400 })
  }

  const config = await getMeetingConfig()
  const targetDirectory = isAbsolute(config.localSavePath)
    ? config.localSavePath
    : join(process.cwd(), config.localSavePath)

  await mkdir(targetDirectory, { recursive: true })

  const safeName = sanitizeFileName(file.name || `recording${extname(file.name) || '.webm'}`)
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`
  const absolutePath = join(targetDirectory, fileName)
  const bytes = Buffer.from(await file.arrayBuffer())

  await writeFile(absolutePath, bytes)

  const normalizedDirectory = targetDirectory.replace(/\\/g, '/')
  const publicRoot = join(process.cwd(), 'public').replace(/\\/g, '/')
  const normalizedPath = absolutePath.replace(/\\/g, '/')
  const publicUrl = normalizedDirectory.startsWith(publicRoot)
    ? normalizedPath.replace(publicRoot, '')
    : null

  const storage = config.storageMode === 'GOOGLE_DRIVE' ? 'google_drive_queue' : 'server'

  await appendMeetingRecording({
    id: randomUUID(),
    bookingId,
    fileName,
    filePath: absolutePath,
    publicUrl,
    size: bytes.byteLength,
    storage,
    status: 'completed',
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    fileName,
    filePath: absolutePath,
    publicUrl,
    storage,
  })
}
