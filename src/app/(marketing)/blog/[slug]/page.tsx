import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BlogPostClient } from './blog-post-client'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug } })
  if (!post) return { title: 'Not Found' }
  return {
    title: post.title,
    description: post.excerpt || post.seoDescription,
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await (prisma as any).blogPost?.findUnique({ where: { slug } })

  if (!post || post.status !== 'PUBLISHED') notFound()

  return (
    <article className="min-h-screen bg-white">
      <header className="bg-[#f8fafc] py-24 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-[#14203E] font-bold text-xs tracking-widest uppercase hover:text-[#14203E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO INSIGHTS
          </Link>
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-black text-[#14203E] leading-tight uppercase tracking-tighter">
              {post.title}
            </h1>
            <div className="flex items-center space-x-6 text-sm font-bold text-gray-400 uppercase tracking-[0.1em]">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#14203E]" />
                {post.publishedAt ? formatDate(post.publishedAt, 'MMM dd, yyyy') : ''}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#14203E]" />
                8 MIN READ
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-20">
        {post.coverImage && (
          <div className="mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img src={post.coverImage} alt={post.title} className="w-full h-auto" />
          </div>
        )}

        <div
          className="prose prose-xl prose-navy max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-gray-600 prose-strong:text-[#14203E]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Client-side footer with working Share button */}
        <BlogPostClient slug={post.slug} title={post.title} excerpt={post.excerpt} />
      </div>
    </article>
  )
}
