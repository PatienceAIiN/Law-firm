import { notFound } from 'next/navigation'
import { prisma } from './prisma'
import { getTenantBySlug, type TenantRecord } from './tenant'
import { getTenantSettingJson } from './tenant-settings'

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
    ...(brand || {})
  }
  
  const officeDetails = (() => {
    try { return aboutProfile?.officeDetails ? JSON.parse(aboutProfile.officeDetails) : { email: tenant.ownerEmail } }
    catch { return { email: tenant.ownerEmail } }
  })()
  const navigation = [
    { name: 'Home', label: 'Home', href: `/t/${tenant.slug}` },
    { name: 'Practice Areas', label: 'Practice Areas', href: `/t/${tenant.slug}/practice-areas` },
    { name: 'Team', label: 'Team', href: `/t/${tenant.slug}/team` },
    { name: 'Articles', label: 'Articles', href: `/t/${tenant.slug}/articles` },
    { name: 'Consult', label: 'Consult', href: `/t/${tenant.slug}/book` },
    { name: 'Contact', label: 'Contact', href: `/t/${tenant.slug}/contact` },
  ]
  return { tenant, brand: brandData, officeDetails, navigation, practiceAreas }
}
