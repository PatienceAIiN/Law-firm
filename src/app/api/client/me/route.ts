import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { clientAuthOptions } from '@/lib/client-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(clientAuthOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.clientUser.findUnique({ where: { email: (email as string).toLowerCase() } })
  return NextResponse.json({ user })
}

// Delete the client account and every thread / message they sent.
export async function DELETE() {
  const session = await getServerSession(clientAuthOptions)
  const email = (session?.user?.email as string | undefined)?.toLowerCase()
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Threads (cascade deletes messages via Prisma relation onDelete).
  await prisma.directThread.deleteMany({ where: { clientEmail: email } })
  await prisma.clientUser.deleteMany({ where: { email } })
  return NextResponse.json({ ok: true })
}
