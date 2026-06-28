import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { uploadFile } from '@/lib/upload'

export const dynamic = 'force-dynamic'

// Tenant-scoped image upload. Either an admin OR a lawyer session is
// accepted. Used for advocate profile photos, team-member images, firm
// logos. 5 MB max, PNG / JPEG / WebP.
export async function POST(req: NextRequest) {
  const admin = await getServerSession(tenantAdminAuthOptions)
  const lawyer = admin ? null : await getServerSession(tenantLawyerAuthOptions)
  const u: any = (admin || lawyer)?.user
  if (!u?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fd = await req.formData()
  const file = fd.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  if (!allowed.includes(file.type.toLowerCase())) {
    return NextResponse.json({ error: 'PNG / JPEG / WebP only' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Max 5 MB' }, { status: 400 })
  }

  try {
    const url = await uploadFile(file)
    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}
