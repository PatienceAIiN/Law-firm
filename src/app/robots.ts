import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXTAUTH_URL || 'https://barrister.patienceai.in').replace(/\/$/, '')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/lawyer/',
        '/super-admin/',
        '/team/*/admin/',
        '/team/*/lawyer/',
        '/api/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
