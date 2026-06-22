import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { clearGmailAccount, advocateMailKey } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(advocateAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await clearGmailAccount(advocateMailKey(session.user.id))
  return NextResponse.json({ success: true })
}
