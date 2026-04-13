'use server'

import { uploadFile } from '@/lib/storage'

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file uploaded')
  }

  const uploaded = await uploadFile({
    file,
    prefix: 'uploads',
    localDirectory: 'public/uploads',
    publicUrlPrefix: '/uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'],
  })

  return uploaded.url
}
