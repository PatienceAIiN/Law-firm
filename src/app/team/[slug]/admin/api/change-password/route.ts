import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { currentPassword, newPassword } = await req.json().catch(() => ({}))
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }
  const admin = await prisma.adminUser.findFirst({ where: { id: u.id, tenantId: u.tenantId } })
  if (!admin) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  const ok = await bcrypt.compare(currentPassword, admin.password)
  if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.adminUser.update({ where: { id: admin.id }, data: { password: hashed } })
  return NextResponse.json({ success: true })
}
