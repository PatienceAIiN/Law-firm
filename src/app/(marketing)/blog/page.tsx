import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { BlogListingClient } from './blog-listing-client'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Blog & Legal Insights',
    description: 'Stay informed with the latest legal news, analysis, and insights from our experienced advocates.',
  }
}

export default async function BlogListingPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
  })

  return <BlogListingClient posts={posts} />
}
