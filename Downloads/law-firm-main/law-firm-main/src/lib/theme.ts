import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

export interface SiteTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  navbarColor: string
  footerColor: string
  borderRadius: string
  fontFamily: 'sans' | 'serif'
  logoUrl: string
  faviconUrl: string
  siteTitle: string
  updatedAt?: string
}

export const DEFAULT_THEME: SiteTheme = {
  primaryColor: '#0a192f', // Navy 900
  secondaryColor: '#c5a059', // Gold
  accentColor: '#112240', // Lighter Navy
  navbarColor: '#ffffff',
  footerColor: '#0a192f',
  borderRadius: '0.75rem',
  fontFamily: 'sans',
  logoUrl: '',
  faviconUrl: '',
  siteTitle: 'Senior Advocate Law Firm'
}

async function loadSiteTheme(): Promise<SiteTheme> {
  const setting = await (prisma as any).siteSetting?.findUnique({
    where: { key: 'site_theme' }
  })

  if (!setting) return DEFAULT_THEME

  try {
    const parsed = JSON.parse(setting.value)
    const merged = { ...DEFAULT_THEME, ...parsed }

    return {
      ...merged,
      primaryColor: merged.primaryColor || DEFAULT_THEME.primaryColor,
      secondaryColor: merged.secondaryColor || DEFAULT_THEME.secondaryColor,
      accentColor: merged.accentColor || merged.secondaryColor || DEFAULT_THEME.accentColor,
      borderRadius: merged.borderRadius || DEFAULT_THEME.borderRadius,
      fontFamily: merged.fontFamily === 'serif' ? 'serif' : 'sans',
      logoUrl: merged.logoUrl || '',
      faviconUrl: merged.faviconUrl || '',
      siteTitle: merged.siteTitle || DEFAULT_THEME.siteTitle,
      updatedAt: setting.updatedAt?.toISOString(),
    }
  } catch {
    return DEFAULT_THEME
  }
}

export const getSiteTheme = unstable_cache(loadSiteTheme, ['site-theme'], {
  revalidate: 300,
  tags: ['site-theme']
})
