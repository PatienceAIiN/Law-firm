import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/upload'

export const dynamic = 'force-dynamic'

// Public endpoint for clients to upload a payment proof image while
// confirming a UTR. Only accepts png / jpg / jpeg under 5 MB.
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  const type = (file.type || '').toLowerCase()
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(type)) {
    return NextResponse.json({ error: 'PNG or JPEG only' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5 MB' }, { status: 400 })
  try {
    const url = await uploadFile(file)
    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}
