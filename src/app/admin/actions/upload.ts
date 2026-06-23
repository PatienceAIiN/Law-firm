'use server'

import { uploadFile } from '@/lib/upload'

// Returns the uploaded URL directly. On failure throws a clean Error whose
// message survives Next.js prod redaction — callers already do
// `try { await uploadImage(fd) } catch (e) { setError(e.message) }`.
export async function uploadImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file selected')
  try {
    return await uploadFile(file)
  } catch (err: any) {
    const msg = err?.message || 'Upload failed'
    throw new Error(msg)
  }
}
