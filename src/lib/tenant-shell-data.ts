import { notFound } from 'next/navigation'
import { prisma } from './prisma'
import { getTenantBySlug, type TenantRecord } from './tenant'
import { getTenantSettingJson } from './tenant-settings'
import { fetchWithCache } from './redis'

export type TenantPublicData = {
  tenant: TenantRecord
  brand: any
  officeDetails: any
  navigation: { name: string; label: string; href: string }[]
  practiceAreas: any[]
}

export async function loadTenantPublicShell(slug: string): Promise<TenantPublicData> {
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  return fetchWithCache(
    `tenant_shell_v2:${tenant.id}`,
    async () => {
      const [brand, practiceAreas, aboutProfile, siteTheme] = await Promise.all([
        getTenantSettingJson<any>(tenant.id, 'brand_config'),
        prisma.practiceArea.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { order: 'asc' } }),
        prisma.aboutProfile.findFirst({ where: { tenantId: tenant.id } }),
        getTenantSettingJson<any>(tenant.id, 'site_theme')
      ])
      const theme = siteTheme || {}
      const brandData = {
        firm_name: theme.siteTitle || tenant.name,
        firm_full_name: theme.siteTitle || tenant.name,
        logo_text: theme.siteTitle || tenant.name,
        use_image_logo: !!theme.logoUrl,
        logo_image_url: theme.logoUrl,
        home_cover_url: theme.homeCoverUrl || (brand as any)?.home_cover_url || '',
        firm_address: theme.firmAddress || (brand as any)?.firm_address || '',
        ...(brand || {})
      }
      
      const officeDetails = (() => {
        try { return aboutProfile?.officeDetails ? JSON.parse(aboutProfile.officeDetails) : { email: tenant.ownerEmail } }
        catch { return { email: tenant.ownerEmail } }
      })()
      const navigation = [
        { name: 'Home', label: 'Home', href: `/team/${tenant.slug}` },
        { name: 'Practice Areas', label: 'Practice Areas', href: `/team/${tenant.slug}/practice-areas` },
        { name: 'Team', label: 'Team', href: `/team/${tenant.slug}/team` },
        { name: 'Articles', label: 'Articles', href: `/team/${tenant.slug}/articles` },
        { name: 'Consult', label: 'Consult', href: `/team/${tenant.slug}/book` },
        { name: 'Contact', label: 'Contact', href: `/team/${tenant.slug}/contact` },
      ]
      return { tenant, brand: brandData, officeDetails, navigation, practiceAreas }
    },
    // 10-minute TTL. The cache key is busted on every admin write
    // (see admin/actions.ts → invalidateCache) so this is safe to be long.
    600
  )
}
