import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, GIF allowed.' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum 5 MB.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const extension = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
  const publicPath = join(process.cwd(), 'public', 'uploads')

  await mkdir(publicPath, { recursive: true })
  await writeFile(join(publicPath, filename), buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
