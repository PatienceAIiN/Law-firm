'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file uploaded')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const extension = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
  
  // Ensure directory exists
  const publicPath = join(process.cwd(), 'public', 'uploads')
  try {
    await mkdir(publicPath, { recursive: true })
  } catch (e) {}

  const path = join(publicPath, filename)
  await writeFile(path, buffer)

  return `/uploads/${filename}`
}
