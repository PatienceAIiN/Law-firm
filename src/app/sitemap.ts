import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXTAUTH_URL || 'https://barrister.patienceai.in').replace(/\/$/, '')

  // Platform root pages
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Tenant public pages
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      select: { slug: true, updatedAt: true },
    })

    tenants.forEach((tenant) => {
      const tBase = `${baseUrl}/team/${tenant.slug}`
      routes.push({
        url: tBase,
        lastModified: tenant.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.9,
      })
      routes.push({
        url: `${tBase}/practice-areas`,
        lastModified: tenant.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
      routes.push({
        url: `${tBase}/articles`,
        lastModified: tenant.updatedAt,
        changeFrequency: 'daily',
        priority: 0.8,
      })
      routes.push({
        url: `${tBase}/team`,
        lastModified: tenant.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
      routes.push({
        url: `${tBase}/book`,
        lastModified: tenant.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
      routes.push({
        url: `${tBase}/contact`,
        lastModified: tenant.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    })

    // Tenant published blog posts
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true, tenant: { select: { slug: true } } },
    })

    posts.forEach((post) => {
      routes.push({
        url: `${baseUrl}/team/${post.tenant.slug}/articles/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'yearly',
        priority: 0.6,
      })
    })

    // Tenant practice areas
    const practiceAreas = await prisma.practiceArea.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true, tenant: { select: { slug: true } } },
    })

    practiceAreas.forEach((pa) => {
      routes.push({
        url: `${baseUrl}/team/${pa.tenant.slug}/practice-areas/${pa.slug}`,
        lastModified: pa.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return routes
}
