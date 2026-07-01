import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { basename, extname, isAbsolute, join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { appendMeetingRecording, getMeetingConfig, getBookingWithSlot } from '@/lib/meeting-workspace'
import { rateLimit, clientIp } from '@/lib/rate-limit'

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

  // Only accept recordings for a real booking, and cap uploads per IP so
  // this can't be used to fill the server's disk.
  const rl = await rateLimit(`rec:${clientIp(req)}`, 20, 3600)
  if (!rl.ok) return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 })
  const booking = await getBookingWithSlot(bookingId)
  if (!booking) return NextResponse.json({ error: 'Unknown booking' }, { status: 404 })
  if (file.size > 500 * 1024 * 1024) return NextResponse.json({ error: 'Recording too large (max 500 MB)' }, { status: 400 })

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
