import { prisma } from './prisma'
import { fetchWithCache } from './redis'

export type TenantRecord = {
  id: string
  slug: string
  name: string
  ownerEmail: string
  status: string
}

export async function getTenantBySlug(slug: string): Promise<TenantRecord | null> {
  if (!slug) return null
  const normalizedSlug = slug.toLowerCase()
  return fetchWithCache(
    `tenant:${normalizedSlug}`,
    async () => {
      const t = await prisma.tenant.findUnique({ where: { slug: normalizedSlug } })
      if (!t) return null
      return { id: t.id, slug: t.slug, name: t.name, ownerEmail: t.ownerEmail, status: t.status }
    },
    86400 // Cache for 24 hours
  )
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function isReservedSlug(slug: string): boolean {
  const reserved = new Set([
    'admin', 'api', 'lawyer', 'meeting', 'signup', 'login', 'logout',
    'register', 'auth', 'static', 'public', 'default', 'app', 't',
    'about', 'contact', 'blog', 'practice-areas', 'consultation', 'terms',
    'privacy', 'sitemap', 'health', 'status',
  ])
  return reserved.has(slug)
}
