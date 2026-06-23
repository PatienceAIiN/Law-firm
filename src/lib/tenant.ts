import { prisma } from './prisma'

export type TenantRecord = {
  id: string
  slug: string
  name: string
  ownerEmail: string
  status: string
}

export async function getTenantBySlug(slug: string): Promise<TenantRecord | null> {
  if (!slug) return null
  const t = await prisma.tenant.findUnique({ where: { slug: slug.toLowerCase() } })
  if (!t) return null
  return { id: t.id, slug: t.slug, name: t.name, ownerEmail: t.ownerEmail, status: t.status }
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
