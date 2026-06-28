import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { clearGmailAccount } from '@/lib/gmail'
import { tenantGmailAdminKey } from '@/lib/tenant-settings'

export async function POST() {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await clearGmailAccount(tenantGmailAdminKey(u.tenantId))
  return NextResponse.json({ success: true })
}
