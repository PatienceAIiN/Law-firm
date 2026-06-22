import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(advocateAuthOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json().catch(() => ({}))
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  const advocate = await prisma.advocate.findUnique({ where: { id: session.user.id } })
  if (!advocate) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const ok = await bcrypt.compare(currentPassword, advocate.password)
  if (!ok) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.advocate.update({ where: { id: advocate.id }, data: { password: hashed } })

  return NextResponse.json({ success: true })
}
