import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { clearGmailAccount } from '@/lib/gmail'
import { tenantGmailLawyerKey } from '@/lib/tenant-settings'

export async function POST() {
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.tenantId || !u?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await clearGmailAccount(tenantGmailLawyerKey(u.tenantId, u.id))
  return NextResponse.json({ success: true })
}
