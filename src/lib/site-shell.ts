import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl } from './location'
import { getSitePages, mergePageLinks, toPageLink } from './site-pages'

export type MarketingShellData = {
  brand: any
  navigation: any[] | undefined
  footerConfig: any
  officeDetails: any
  practiceAreas: any[]
}

async function loadMarketingShellData(): Promise<MarketingShellData> {
  let settings: any[] = [], practiceAreas: any[] = [], profile: any = null, sitePages: any[] = []
  try {
    ;[settings, practiceAreas, profile, sitePages] = await Promise.all([
      prisma.siteSetting.findMany({
        where: {
          key: {
            in: ['brand_config', 'navigation_links', 'footer_config']
          }
        }
      }),
      prisma.practiceArea.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      }),
      prisma.aboutProfile.findUnique({
        where: { id: 'default-profile' }
      }),
      getSitePages(),
    ])
  } catch {}

  const safeParse = (value: string | null | undefined) => {
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  const getConfig = (key: string) => {
    const setting = settings.find((item) => item.key === key)
    return safeParse(setting?.value)
  }

  const pageLinks = sitePages
    .filter((page) => page.placement === 'NAVBAR' || page.placement === 'FOOTER' || page.placement === 'BOTH')
    .map(toPageLink)

  const navPages = sitePages
    .filter((page) => page.placement === 'NAVBAR' || page.placement === 'BOTH')
    .map(toPageLink)

  const footerPages = sitePages
    .filter((page) => page.placement === 'FOOTER' || page.placement === 'BOTH')
    .map(toPageLink)

  const baseNavigation = getConfig('navigation_links') ?? undefined
  const baseFooterConfig = getConfig('footer_config') ?? {}
  const mergedNavigation = mergePageLinks(baseNavigation || [], navPages)
  const mergedFooterLinks = mergePageLinks((baseFooterConfig.quick_links || mergedNavigation) as any[], footerPages)

  const officeDetails = safeParse(profile?.officeDetails) || {}
  const enrichedOfficeDetails = officeDetails.address ? {
    ...officeDetails,
    mapEmbedUrl: officeDetails.mapEmbedUrl || buildGoogleMapsEmbedUrl(officeDetails.address),
    mapLink: officeDetails.mapLink || buildGoogleMapsSearchUrl(officeDetails.address),
  } : officeDetails

  return {
    brand: getConfig('brand_config'),
    navigation: mergedNavigation,
    footerConfig: {
      ...baseFooterConfig,
      quick_links: mergedFooterLinks,
      page_links: pageLinks,
    },
    officeDetails: enrichedOfficeDetails,
    practiceAreas
  }
}

export const getMarketingShellData = unstable_cache(loadMarketingShellData, ['marketing-shell-data'], {
  revalidate: 300,
  tags: ['marketing-shell']
})
