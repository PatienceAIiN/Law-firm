'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { BlogModal } from '@/components/blog-modal'
import type { BlogPost } from '@prisma/client'

interface RecentBlogsProps {
  data: BlogPost[]
  content?: any
}

export function RecentBlogs({ data, content }: RecentBlogsProps) {
  const section = content?.home?.blogs || {}
  const [activePost, setActivePost] = useState<BlogPost | null>(null)

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium">
            <span>{section.badge || 'Legal Insights'}</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-[var(--primary)] leading-tight">
            {section.title?.split(' ')[0] || 'Latest'}{' '}
            <span className="text-[var(--primary)]">{section.title?.split(' ').slice(1).join(' ') || 'Articles & Insights'}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {section.subtitle || 'Stay updated with the latest legal developments, insights, and expert analysis from our experienced legal team.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((post) => (
            <article
              key={post.id}
              onClick={() => setActivePost(post)}
              className="card-3d bg-white rounded-[2rem] border border-gray-100 overflow-hidden group flex flex-col h-full cursor-pointer"
            >
              <div className="aspect-[16/10] bg-[var(--primary)]/5 relative overflow-hidden flex-shrink-0">
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#14203E] to-[#112240]">
                    <Clock className="w-12 h-12 text-[var(--primary)] opacity-20" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#F6F0E8] text-[var(--primary)] text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Law Firm Update
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center space-x-4 text-xs font-semibold text-gray-400 mb-4">
                  <div className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>{post.publishedAt ? formatDate(post.publishedAt, 'MMM dd, yyyy') : 'No Date'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>{Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200))} MIN READ</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[var(--primary)] mb-4 group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-tight">
                  {post.title}
                </h3>

                <p className="text-gray-500 mb-8 flex-1 line-clamp-3 leading-relaxed text-sm">
                  {post.excerpt}
                </p>

                <div className="inline-flex items-center text-[var(--primary)] font-bold text-sm tracking-tight border-b-2 border-[#F4E8D8] pb-1 self-start group-hover:border-[var(--primary)] transition-all mt-auto">
                  READ ARTICLE
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </article>
          ))}

          {data.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400">
              No articles published yet. Stay tuned!
            </div>
          )}
        </div>

        <div className="text-center mt-16">
          <Button asChild variant="outline" className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white px-8 py-6 rounded-xl font-bold">
            <Link href="/blog" className="flex items-center gap-2">
              {section.ctaText || 'View All Insights'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <BlogModal post={activePost} onClose={() => setActivePost(null)} />
    </section>
  )
}
