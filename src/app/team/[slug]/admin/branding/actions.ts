'use server'

import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { setTenantSettingJson } from '@/lib/tenant-settings'
import { invalidateCache } from '@/lib/redis'
import { revalidatePath } from 'next/cache'

export async function updateBranding(slug: string, formData: FormData) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')

  const tenant = await getTenantBySlug(slug)
  if (!tenant) throw new Error('Tenant not found')

  const logoUrl = (formData.get('logoUrl') as string) || ''

  const themeConfig = {
    primaryColor: formData.get('primaryColor') as string,
    secondaryColor: formData.get('secondaryColor') as string,
    accentColor: formData.get('accentColor') as string,
    navbarColor: formData.get('navbarColor') as string,
    footerColor: formData.get('footerColor') as string,
    borderRadius: formData.get('borderRadius') as string,
    fontFamily: formData.get('fontFamily') as string,
    logoUrl,
    faviconUrl: logoUrl, // keep in sync — favicon mirrors the logo
    homeCoverUrl: (formData.get('homeCoverUrl') as string) || '',
    firmAddress: ((formData.get('firmAddress') as string) || '').trim(),
    siteTitle: formData.get('siteTitle') as string,
  }

  await setTenantSettingJson(tenant.id, 'site_theme', themeConfig)

  // Bust the Redis shell cache so the public site picks up the new logo/favicon
  await invalidateCache(`tenant_shell_v2:${tenant.id}`)

  // Bust all cached pages under this tenant so the new logo/favicon appears instantly
  revalidatePath(`/team/${slug}`, 'layout')
  revalidatePath(`/team/${slug}`)
}
