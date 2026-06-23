import { MetadataRoute } from 'next'

export default async function robots({ params }: { params: Promise<{ slug: string }> }): Promise<MetadataRoute.Robots> {
  const baseUrl = (process.env.NEXTAUTH_URL || 'https://barrister.patienceai.in').replace(/\/$/, '')
  const slug = (await params).slug

  return {
    rules: {
      userAgent: '*',
      allow: `/team/${slug}/`,
      disallow: [
        `/team/${slug}/admin/`,
        `/team/${slug}/lawyer/`,
        `/team/${slug}/api/`,
      ],
    },
    sitemap: `${baseUrl}/team/${slug}/sitemap.xml`,
  }
}
