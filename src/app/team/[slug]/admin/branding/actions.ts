'use server'

import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { setTenantSettingJson } from '@/lib/tenant-settings'
import { revalidatePath } from 'next/cache'

export async function updateBranding(slug: string, formData: FormData) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')

  const tenant = await getTenantBySlug(slug)
  if (!tenant) throw new Error('Tenant not found')

  const themeConfig = {
    primaryColor: formData.get('primaryColor') as string,
    secondaryColor: formData.get('secondaryColor') as string,
    accentColor: formData.get('accentColor') as string,
    navbarColor: formData.get('navbarColor') as string,
    footerColor: formData.get('footerColor') as string,
    borderRadius: formData.get('borderRadius') as string,
    fontFamily: formData.get('fontFamily') as string,
    logoUrl: formData.get('logoUrl') as string,
    faviconUrl: formData.get('faviconUrl') as string,
    siteTitle: formData.get('siteTitle') as string,
  }

  await setTenantSettingJson(tenant.id, 'site_theme', themeConfig)

  revalidatePath(`/team/${slug}`, 'layout')
}
