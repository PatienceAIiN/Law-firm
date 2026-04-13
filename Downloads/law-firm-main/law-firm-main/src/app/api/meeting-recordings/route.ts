import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { appendMeetingRecording, getMeetingConfig } from '@/lib/meeting-workspace'
import { uploadFile } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file')
  const bookingId = (formData.get('bookingId') as string) || ''

  if (!(file instanceof File) || !bookingId) {
    return NextResponse.json({ error: 'File and bookingId are required' }, { status: 400 })
  }

  const config = await getMeetingConfig()
  const uploaded = await uploadFile({
    file,
    prefix: `meeting-recordings/${bookingId}`,
    localDirectory: config.localSavePath,
    publicUrlPrefix: '/meeting-recordings',
    allowedTypes: ['video/webm', 'video/mp4', 'video/quicktime', 'application/octet-stream'],
  })

  const fileName = uploaded.url.split('/').pop() || file.name
  const storage = config.storageMode === 'GOOGLE_DRIVE' ? 'google_drive_queue' : uploaded.storage

  await appendMeetingRecording({
    id: randomUUID(),
    bookingId,
    fileName,
    filePath: uploaded.url,
    publicUrl: uploaded.url,
    size: uploaded.size,
    storage,
    status: 'completed',
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    fileName,
    filePath: uploaded.url,
    publicUrl: uploaded.url,
    storage,
  })
}
