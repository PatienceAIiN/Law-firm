'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { setTenantSettingValue } from '@/lib/tenant-settings'

export async function saveLegalPage(slug: string, which: 'terms' | 'privacy', html: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  const key = which === 'terms' ? 'terms_html' : 'privacy_html'
  // Light sanitisation: strip any script tags before storing. Tiptap output
  // never includes them but we want to be defensive against pasted HTML.
  const safe = (html || '').replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
  await setTenantSettingValue(u.tenantId, key, safe)
  revalidatePath(`/team/${slug}/${which}`)
  revalidatePath(`/team/${slug}/admin/legal`)
}
