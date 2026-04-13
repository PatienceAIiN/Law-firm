import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

export type SitePagePlacement = 'NAVBAR' | 'FOOTER' | 'BOTH' | 'NONE'

export type SitePage = {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  heroImage?: string
  placement: SitePagePlacement
  createdAt: string
  updatedAt: string
}

export const DEFAULT_SITE_PAGES: SitePage[] = [
  {
    id: 'rights-policy',
    title: 'Rights & Policy',
    slug: 'rights-policy',
    summary: 'Important legal rights, policy details, and site terms.',
    content: 'Use this page to publish legal rights, policy details, and any firm notices you want accessible from the footer.',
    placement: 'FOOTER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

function parsePages(value?: string | null): SitePage[] | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return null

    return parsed
      .filter((item) => item && typeof item.title === 'string' && typeof item.slug === 'string')
      .map((item) => ({
        id: String(item.id || item.slug),
        title: String(item.title).trim(),
        slug: String(item.slug).trim().replace(/^\/+/, ''),
        summary: String(item.summary || '').trim(),
        content: String(item.content || '').trim(),
        heroImage: String(item.heroImage || '').trim() || undefined,
        placement: (['NAVBAR', 'FOOTER', 'BOTH', 'NONE'].includes(item.placement) ? item.placement : 'NONE') as SitePagePlacement,
        createdAt: String(item.createdAt || new Date().toISOString()),
        updatedAt: String(item.updatedAt || new Date().toISOString()),
      }))
  } catch {
    return null
  }
}

async function loadSitePages(): Promise<SitePage[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'site_pages' },
  })

  return parsePages(setting?.value) || DEFAULT_SITE_PAGES
}

export const getSitePages = unstable_cache(loadSitePages, ['site-pages'], {
  revalidate: 300,
  tags: ['site-pages'],
})

export function toPageLink(page: SitePage) {
  return {
    name: page.title,
    href: `/${page.slug.replace(/^\/+/, '')}`,
  }
}

export function mergePageLinks<T extends { href?: string }>(base: T[] = [], additions: T[] = []) {
  const additionHrefs = new Set(
    additions
      .map((item) => item.href)
      .filter((href): href is string => Boolean(href))
  )

  const filteredBase = base.filter((item) => !additionHrefs.has(item.href || ''))
  const seen = new Set<string>()
  const merged: T[] = []

  for (const item of [...filteredBase, ...additions]) {
    const href = item.href || ''
    if (!href || seen.has(href)) continue
    seen.add(href)
    merged.push(item)
  }

  return merged
}
