import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap({ params }: { params: Promise<{ slug: string }> }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXTAUTH_URL || 'https://barrister.patienceai.in').replace(/\/$/, '')
  const slug = (await params).slug

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
    select: { id: true, updatedAt: true }
  })

  if (!tenant) return []

  const tBase = `${baseUrl}/team/${slug}`

  const routes: MetadataRoute.Sitemap = [
    {
      url: tBase,
      lastModified: tenant.updatedAt,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${tBase}/practice-areas`,
      lastModified: tenant.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${tBase}/articles`,
      lastModified: tenant.updatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${tBase}/team`,
      lastModified: tenant.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${tBase}/book`,
      lastModified: tenant.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${tBase}/contact`,
      lastModified: tenant.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Tenant published blog posts
  const posts = await prisma.blogPost.findMany({
    where: { tenantId: tenant.id, status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
  })

  posts.forEach((post) => {
    routes.push({
      url: `${tBase}/articles/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'yearly',
      priority: 0.7,
    })
  })

  // Tenant practice areas
  const practiceAreas = await prisma.practiceArea.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { slug: true, updatedAt: true },
  })

  practiceAreas.forEach((pa) => {
    routes.push({
      url: `${tBase}/practice-areas/${pa.slug}`,
      lastModified: pa.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  })

  return routes
}
