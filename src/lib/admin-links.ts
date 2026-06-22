import type { SitePage } from './site-pages'

export type AdminLinkOption = {
  label: string
  href: string
}

export const STATIC_ADMIN_LINK_OPTIONS: AdminLinkOption[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Practice Areas', href: '/practice-areas' },
  { label: 'Consultation', href: '/consultation' },
  { label: 'Contact', href: '/contact' },
  { label: 'Articles', href: '/blog' },
]

export function buildAdminLinkOptions(pages: SitePage[] = []): AdminLinkOption[] {
  const customPages = pages
    .filter((page) => page.placement === 'NAVBAR' || page.placement === 'BOTH' || page.placement === 'FOOTER')
    .map((page) => ({
      label: page.title,
      href: `/${page.slug.replace(/^\/+/, '')}`,
    }))

  const options = [...STATIC_ADMIN_LINK_OPTIONS, ...customPages]
  const seen = new Set<string>()

  return options.filter((item) => {
    if (seen.has(item.href)) return false
    seen.add(item.href)
    return true
  })
}
