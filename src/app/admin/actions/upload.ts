'use server'

import { uploadFile } from '@/lib/upload'

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file uploaded')
  }

  return await uploadFile(file)
}
